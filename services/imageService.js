import { bucket } from "../config/gcs.js";

export async function uploadImageService(req) {
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
      resolve({ success: true, message: fileName });
    });

    stream.end(req.file.buffer)
  })
}

export async function getImageSignedUrlService(fileName) {
  const file = bucket.file(fileName)
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 1000 * 60 * 60 * 24
  })
  console.log(fileName)
  return url
}