import Answare from "../models/Answare.js";
import Template from "../models/Template.js";
import { fileURLToPath } from "url";
import path from "path";
import ejs from "ejs";
import puppeteer from "puppeteer";
import { getImageSignedUrlService } from "./imageService.js";

export async function createTemplateService(newTemplate) {
  try {
    const novo = new Template({...newTemplate});
    await novo.save();
    return novo
  } catch (err) {
    throw err
  }
}

export async function getTemplatesService(kind) {
  try {
    const templates = Template.find({"config.kind": kind})
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

export async function generateAnswarePDFService(answareid, userid){
  const answare = await Answare.findOne({ _id: answareid, user_id: userid }).lean()
  if (!answare) throw new Error("Respostas não encontradas")

  const template = await Template.findById(answare.template_id)
  const pdfBuffer = await generateAnswarePdfService(template, answare);
  
  return pdfBuffer
}


async function generateAnswarePdfService(templatedata, answaredata) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templatePath = path.join(__dirname, "../templates/answaredForm.ejs");
  const formatedPdfStructure = await formatPDFContentJson(templatedata, answaredata)
  // renderiza HTML a partir do template e dos dados
  const html = await ejs.renderFile(templatePath, formatedPdfStructure);

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
  const page = await browser.newPage();
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

  await browser.close();
  return buffer;
}

async function formatPDFContentJson(template, answare) {
  let formatedAnsware = []
  for(let i = 0; i < template.questions.length; i++){
    const currentQuestion = template.questions[i]
    let a = getAnswareObj(answare, currentQuestion.id)

    // Questão sem resposta: insere item vazio para não crashar o template
    if (!a) {
      formatedAnsware = [...formatedAnsware, {
        question_id: currentQuestion.id,
        answare_text: '',
        answare_checkboxes: currentQuestion.check_boxes ?? [],
        answare_coords: null,
        answare_images: [],
        answare_note: ''
      }]
      continue
    }

    let aImages = []
    if(a.answare_images && a.answare_images.length > 0) {
      for(let j = 0; j < a.answare_images.length; j++) {
        let aCurrentImage = await getImageSignedUrlService(a.answare_images[j])
        aImages = [...aImages, aCurrentImage]
      }
    }

    if(currentQuestion.kind == 'signature' && a.answare_text) {
      const url = await getImageSignedUrlService(a.answare_text)
      formatedAnsware = [...formatedAnsware, {...a, answare_text: url}]
    } else {
      formatedAnsware = [...formatedAnsware, {...a, answare_images: aImages}]
    }
  }
  return {form: template, answare: {...answare, answares: formatedAnsware}}
}

function getAnswareObj(answare, questionId) {
  if (!answare || !answare.answares) return null;
  return answare.answares.find(a =>{
    return a.question_id?.toString() == questionId?.toString()
  });
}