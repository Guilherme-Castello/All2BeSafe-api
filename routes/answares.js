import express from "express";
import Answare from "../models/Answare.js";
import Formulario from "../models/Formulario.js";
import { answareForm } from "../utils/fillForm.js";
import { Storage } from "@google-cloud/storage";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

const storage = new Storage();
const bucket = storage.bucket("all2bsafe-images");

async function uploadImage(req) {
  console.log('a')
  return new Promise((resolve, reject) => {
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const file = bucket.file(fileName);

    const stream = file.createWriteStream({
      resumable: false,
      contentType: req.file.mimetype,
    });

    stream.on("error", (err) => {
      console.error(err);
      reject()
    });

    stream.on("finish", async () => {
      console.log('finish')
      resolve({success: true, message: fileName});
    });

    stream.end(req.file.buffer)
  })
}

async function getImageSignedUrl(fileName){
  const file = bucket.file(fileName)
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 1000 * 60 * 60 * 24
  })
  console.log(fileName)
  return url
}

router.get("/test-gcs", async (req, res) => {
  const [files] = await bucket.getFiles();
  res.json(files.map(f => f.name));
});

router.post("/uploadImage", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    
    const uploadedImage = await uploadImage(req)
    if(!uploadedImage.success) throw new Error("Internal error (Image Upload)")
    
    const imageLink = await getImageSignedUrl(uploadedImage.message)
    console.log(imageLink)
    
    res.json({success: true, imageLink, fileName: uploadedImage.message})

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
});

router.post("/getUrl", async (req, res) => {
  try{
    const url = await getImageSignedUrl(req.body.fileName)
    res.status(200).json({success: true, url})
  } catch(e){
    console.error(e);
    res.status(500).json({ error: "Internal error" });
  }
})

router.post('/getAnswaredForm', async (req, res) => {
  try {
    const { aId } = req.body;

    const answare = await Answare.findById(aId);
    const form = await Formulario.findById(answare.form_id);

    const answaredForm = answareForm(form, answare)

    res.json({ message: '200', answaredForm });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/getUserAnswares', async (req, res) => {
  try {
    const { uId } = req.body;

    const result = await Answare
      .find({ user_id: uId })
      .select("_id form_id status name")
      .populate("form_id", "config")
      .lean();

    const configs = result.map(a => ({
      answare_id: a._id,
      form_id: a.form_id._id,
      config: a.form_id.config,
      name: a.name,
      status: a.status
    }));


    res.json({ message: '200', configs });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});


export default router;
