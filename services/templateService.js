import Answare from "../models/Answare.js";
import Template from "../models/Template.js";
import { getUserById } from "./userService.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import ejs from "ejs";
import puppeteer from "puppeteer";
import { getImageAsBase64Service } from "./imageService.js";

function sanitizeQuestionOptions(questions = []) {
  return questions.map(q => ({
    ...q,
    options: Array.isArray(q.options) ? q.options.map(o => o.trim()) : q.options
  }));
}

export async function createTemplateService(newTemplate) {
  try {
    const novo = new Template({
      ...newTemplate,
      questions: sanitizeQuestionOptions(newTemplate.questions)
    });
    await novo.save();
    return novo
  } catch (err) {
    throw err
  }
}

export async function getTemplatesService(kind) {
  try {
    const templates = Template.find({
      "config.kind": kind,
      status: { $ne: 'archived' }
    })
    return templates
  } catch (e) {
    throw e
  }
}

export async function getArchivedTemplatesService(kind) {
  try {
    const templates = Template.find({
      "config.kind": kind,
      status: 'archived'
    })
    return templates
  } catch (e) {
    throw e
  }
}

export async function getTemplateByIdService(tId) {
  try {
    const templates = Template.findById(tId);
    return templates
  } catch (e) {
    throw e
  }
}

export async function updateTemplateService(tId, updatedTemplate, userId) {
  if (!tId) throw new Error("Template id não informado");
  if (!updatedTemplate) throw new Error("Template não informado");
  if (!userId) throw new Error("Usuário não informado");
  if (!Array.isArray(updatedTemplate.questions)) throw new Error("Questions inválidas");
  if (!updatedTemplate.config) throw new Error("Config inválida");

  const template = await Template.findById(tId);
  if (!template) throw new Error("Template não encontrado");

  const user = await getUserById(userId);
  if (!user) throw new Error("Usuário não encontrado");

  const currentKind = Number(template.config.kind);
  const requestedKind = Number(updatedTemplate.config.kind);
  const isMasterTemplate = currentKind === -1;
  const isMasterUser = String(user.company) === "0" && String(user.access_level) === "3";
  const isCompanyAdmin = Number(user.access_level) >= 2;
  const isSameCompanyTemplate = currentKind === Number(user.company);

  if (requestedKind !== currentKind) {
    throw new Error("Não é permitido alterar a empresa do template");
  }

  if (isMasterTemplate && !isMasterUser) {
    throw new Error("Apenas o usuário master pode editar templates master");
  }

  if (!isMasterTemplate && !isMasterUser && !(isCompanyAdmin && isSameCompanyTemplate)) {
    throw new Error("Usuário sem permissão para editar este template");
  }

  const dataToUpdate = {
    questions: sanitizeQuestionOptions(updatedTemplate.questions),
    config: updatedTemplate.config,
  };

  if (updatedTemplate.status) {
    dataToUpdate.status = updatedTemplate.status;
  }

  await Template.updateOne({ _id: tId }, { $set: dataToUpdate }, { runValidators: true });

  return await Template.findById(tId);
}

export async function deleteTemplateService(tId, userId) {
  if (!tId) throw new Error("Template id não informado");
  if (!userId) throw new Error("Usuário não informado");

  const user = await getUserById(userId);
  if (!user) throw new Error("Usuário não encontrado");

  const isMasterUser = String(user.company) === "0" && String(user.access_level) === "3";
  if (!isMasterUser) {
    throw new Error("Apenas o usuário master pode deletar templates");
  }

  const template = await Template.findById(tId);
  if (!template) throw new Error("Template não encontrado");

  await Template.deleteOne({ _id: tId });

  return { message: "Template deletado!" };
}

export async function generateAnswarePDFService(answareid, userid){
  const answare = await Answare.findOne({ _id: answareid, user_id: userid }).lean()
  if (!answare) throw new Error("Respostas não encontradas")

  // Reconstrói a estrutura de template a partir dos metadados gravados na Answare,
  // eliminando a dependência da coleção Template em tempo de leitura.
  const templateLike = {
    config: answare.template_config,
    questions: answare.answares.map(item => ({
      id:          item.question_id,
      title:       item.question_title,
      kind:        item.question_kind,
      section:     item.question_section,
      options:     item.question_options ?? [],
      check_boxes: item.answare_checkboxes ?? []
    }))
  };

  return await generateAnswarePdfService(templateLike, answare);
}


async function generateAnswarePdfService(templatedata, answaredata) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templatePath = path.join(__dirname, "../templates/answaredForm.ejs");
  const logoPath     = path.join(__dirname, "../assets/all2bsafe.svg");

  const formatedPdfStructure = await formatPDFContentJson(templatedata, answaredata)

  // Lê o SVG do disco e injeta inline — Puppeteer não acessa arquivos via path relativo
  let logoSvg = null;
  if (fs.existsSync(logoPath)) {
    logoSvg = fs.readFileSync(logoPath, "utf8");
  }

  const html = await ejs.renderFile(templatePath, { ...formatedPdfStructure, logoSvg });

  // gera PDF com puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ]
  });
  try {
    const page = await browser.newPage();
    // As imagens já estão embutidas como data URIs base64 — não há requests de rede.
    // domcontentloaded é suficiente e evita timeouts por networkidle0.
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "2cm",
        bottom: "2cm",
        left: "2cm",
        right: "2cm"
      }
    });

    return buffer;
  } finally {
    await browser.close();
  }
}

async function formatPDFContentJson(template, answare) {
  const formatedAnsware = await Promise.all(
    template.questions.map(async (currentQuestion) => {
      const a = getAnswareObj(answare, currentQuestion.id)

      // Questão sem resposta: insere item vazio para não crashar o template
      if (!a) {
        return {
          question_id: currentQuestion.id,
          answare_text: '',
          answare_checkboxes: currentQuestion.check_boxes ?? [],
          answare_coords: null,
          answare_images: [],
          answare_note: ''
        }
      }

      // Baixa todas as imagens em paralelo como data URIs base64 — o Puppeteer
      // não precisará fazer nenhum request de rede ao renderizar o PDF.
      const aImages = a.answare_images?.length > 0
        ? await Promise.all(a.answare_images.map(img => getImageAsBase64Service(img)))
        : []

      if (currentQuestion.kind === 'signature' && a.answare_text) {
        const parts = a.answare_text.split('|divide|')
        const signerName    = parts.length > 1 ? parts[0] : ''
        const imageFileName = parts[parts.length - 1]
        const signatureData = imageFileName ? await getImageAsBase64Service(imageFileName) : ''
        return { ...a, answare_signer_name: signerName, answare_text: signatureData }
      }

      return { ...a, answare_images: aImages }
    })
  )

  return { form: template, answare: { ...answare, answares: formatedAnsware } }
}

function getAnswareObj(answare, questionId) {
  if (!answare || !answare.answares) return null;
  return answare.answares.find(a =>{
    return a.question_id?.toString() == questionId?.toString()
  });
}

export async function toggleArchiveTemplateService(tId) {
  const template = await Template.findById(tId);
  if (!template) throw new Error("Template não encontrado");

  const newStatus = template.status === 'archived' ? 'open' : 'archived';

  await Template.updateOne({ _id: tId }, { $set: { status: newStatus } });

  return { message: `Template ${newStatus === 'archived' ? 'arquivado' : 'desarquivado'}!` };
}
