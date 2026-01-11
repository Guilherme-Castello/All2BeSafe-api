import express from "express";
import PDFDocument from "pdfkit";
import Formulario from "../models/Formulario.js"; 
import ejs from "ejs";
import fs from "fs";
import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import Answare from "../models/Answare.js";

const app = express();

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    console.log('test access')
    const novo = new Formulario(req.body);
    await novo.save();
    res.status(201).json(novo);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const formularios = await Formulario.find();
    res.json(formularios);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const formulario = await Formulario.findById(req.params.id);
    res.json(formulario);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const atualizado = await Formulario.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(atualizado);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Formulario.findByIdAndDelete(req.params.id);
    res.json({ mensagem: 'Deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/answare', async (req, res) => {
  try{
    const answare = new Answare(req.body)
    await answare.save()
    console.log(req.body)

    res.status(200).json({answare: answare, message: 'Answare submitted successfuly'})
  } catch(err) {
    console.log(req.body)
    console.error(err.message)
    res.status(500).json({erro: err.message})
  }
})

router.post('/updateAnsware', async (req, res) => {
  try {
    const { aId, updatedAnware } = req.body;

    const answare = await Answare.findByIdAndUpdate(
      aId,
      { answares: updatedAnware.answares }, // atualiza TODO o objeto
      { new: true }              // retorna o doc atualizado
    );

    if (!answare) {
      return res.status(404).json({ message: 'Answare not found' });
    }

    res.status(200).json({ answare, message: 'Answare submitted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/generateFormPDFHTML', async (req, res) => {
  try{
    const { formid } = req.body;
    const form = await Formulario.findById(formid)
    // const html = `
    //   <html>
    //     <body>
    //       <h1>Formulário</h1>
    //       <p>Nome: Guilherme</p>
    //       <p>Email: guilherme@email.com</p>
    //     </body>
    //   </html>
    // `;
    const pdfBuffer = await generatePdf(form);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=form.pdf");
    res.end(pdfBuffer);
  } catch(e) {
    console.error('handle: ', e)
  }
})

router.post('/generateFormAnswaredPDFHTML', async (req, res) => {
  try{
    const { formid, userid } = req.body;
    const form = await Formulario.findById(formid)
    const answare = await Answare.findOne({form_id: formid, user_id: userid}).lean()
    if(!answare) throw new Error("Respotas não encontradas")
    const pdfBuffer = await generateAnswarePdf(form, answare);
    console.log('ok here')
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=form.pdf");
    res.end(pdfBuffer);
  } catch(e) {
    console.error('handle: ', e)
    console.error(e.message)
  }
})

router.post('/generateHtmlPreview', async (req, res) => {
  try{
    const { form } = req.body;
    console.log(form)
    const html = await generatePreviewHTML(form);
    console.log(html)
    res.end(html);
    res.status(200).json({html: html})
  } catch(e) {
    console.error('handle: ', e)
  }
})

async function generatePdf(data) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templatePath = path.join(__dirname, "../templates/checkboxQuestion.ejs");

  
  console.log(data)
  // renderiza HTML a partir do template e dos dados
  const html = await ejs.renderFile(templatePath, data);

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
  });

  await browser.close();
  return buffer;
}

async function generatePreviewHTML(formdata){
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templatePath = path.join(__dirname, "../templates/answaredForm.ejs");
  console.log({form: formdata, answare: undefined})
  const html = await ejs.renderFile(templatePath, {form: {questions: formdata}, answare: undefined});
  return html
}

async function generateAnswarePdf(formdata, answaredata) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templatePath = path.join(__dirname, "../templates/answaredForm.ejs");
  
  // renderiza HTML a partir do template e dos dados
  console.log(formdata)
  const html = await ejs.renderFile(templatePath, {form: formdata, answare: answaredata});

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



export default router;