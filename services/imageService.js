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

export async function deleteImageService(fileName) {
  const file = bucket.file(fileName)
  await file.delete()
  return { success: true }
}

export async function getImageSignedUrlService(fileName) {
  const file = bucket.file(fileName)
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 1000 * 60 * 59
  })
  console.log(fileName)
  return url
}

/**
 * Baixa a imagem diretamente do GCS e retorna um data URI base64.
 * Elimina a necessidade de o Puppeteer fazer requests de rede durante a geração do PDF.
 */
export async function getImageAsBase64Service(fileName) {
  if (!fileName) return ''
  try {
    const file = bucket.file(fileName)
    const [buffer] = await file.download()
    const [metadata] = await file.getMetadata()
    const mimeType = metadata.contentType ?? 'image/jpeg'
    const base64 = buffer.toString('base64')
    console.log(`[pdf] imagem convertida: ${fileName}`)
    return `data:${mimeType};base64,${base64}`
  } catch (err) {
    console.error(`[pdf] falha ao baixar imagem ${fileName}:`, err.message)
    return ''
  }
}