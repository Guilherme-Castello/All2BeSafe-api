import Answare from "../models/Answare.js";
import Template from "../models/Template.js";

export async function createTemplateService(newTemplate) {
  try {
    const novo = new Template(newTemplate);
    await novo.save();
    return novo
  } catch (err) {
    throw e
  }
}

export async function getTemplatesService() {
  try {
    const templates = Template.find()
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

export async function generateAnswarePDFService(templateid, userid){
  const template = await Template.findById(templateid)
  const answare = await Answare.findOne({ template_id: templateid, user_id: userid }).lean()

  if (!answare) throw new Error("Respotas não encontradas")
  const pdfBuffer = await generateAnswarePdfService(template, answare);
  return pdfBuffer
}


async function generateAnswarePdfService(templatedata, answaredata) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templatePath = path.join(__dirname, "../templates/answaredForm.ejs");

  // renderiza HTML a partir do template e dos dados
  const html = await ejs.renderFile(templatePath, { form: templatedata, answare: answaredata });

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
  await page.setContent(html, { waitUntil: "networkidle0" });

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