import { bucket } from "../config/gcs.js";
import sharp from "sharp";

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
 * Gera uma URL pré-assinada GCS para upload direto pelo cliente (PUT).
 * O app envia a imagem diretamente ao GCS sem passar pelo servidor da API,
 * eliminando o uso de memória do Multer e o tráfego pela instância Render.
 *
 * @param {string} [clientFileName] - nome sugerido pelo cliente (opcional)
 * @returns {{ signedUrl: string, fileName: string }}
 */
export async function getUploadSignedUrlService(clientFileName) {
  // Nome gerado server-side para garantir unicidade e evitar path traversal
  const ext = clientFileName ? clientFileName.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg' : 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const file = bucket.file(fileName);

  const [signedUrl] = await file.generateSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutos
    contentType: 'image/jpeg',
  });

  return { signedUrl, fileName };
}

/**
 * Baixa a imagem do GCS, redimensiona para no máximo 900px de largura
 * e comprime para JPEG 75% — evita OOM no Puppeteer ao gerar o PDF.
 * Retorna um data URI base64 pronto para embutir no HTML.
 */
export async function getImageAsBase64Service(fileName) {
  if (!fileName) return ''
  try {
    const file = bucket.file(fileName)
    const [rawBuffer] = await file.download()

    const compressed = await sharp(rawBuffer)
      .resize({ width: 900, withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 75 })
      .toBuffer()

    const base64 = compressed.toString('base64')
    console.log(`[pdf] imagem convertida: ${fileName} (${Math.round(compressed.length / 1024)}KB)`)
    return `data:image/jpeg;base64,${base64}`
  } catch (err) {
    console.error(`[pdf] falha ao processar imagem ${fileName}:`, err.message)
    return ''
  }
}