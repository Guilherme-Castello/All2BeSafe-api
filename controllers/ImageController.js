import { deleteImageService, getImageSignedUrlService, getUploadSignedUrlService, uploadImageService } from "../services/imageService.js";
import { handleError, handleSuccess } from "../utils/httpResponse.js";

export async function uploadImageController(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const uploadedImage = await uploadImageService(req)
    if (!uploadedImage.success) throw new Error("Internal error (Image Upload)")

    const imageLink = await getImageSignedUrlService(uploadedImage.message)
    // return handleSuccess({imageLink, fileName: uploadedImage.message}, res)
    res.status(200).json({imageLink, fileName: uploadedImage.message, success: true})
  } catch (e) {
    console.error(e);
    res.status(500).json({error: e.message})
  }
}

export async function getImageUrlController(req, res) {
  try {
    const url = await getImageSignedUrlService(req.body.fileName)
    handleSuccess(url, res)
  } catch (e) {
    handleError(e.message, res)
  }
}

/**
 * Retorna uma URL pré-assinada GCS para upload direto (PUT) pelo app.
 * O cliente envia a imagem sem passar pelo servidor, reduzindo latência
 * e uso de memória RAM na instância Render.
 */
export async function getUploadUrlController(req, res) {
  try {
    const { fileName: clientFileName } = req.body;
    const result = await getUploadSignedUrlService(clientFileName);
    return handleSuccess(result, res);
  } catch (e) {
    return handleError(e.message, res);
  }
}

export async function deleteImageController(req, res) {
  try {
    const { fileName } = req.body
    if (!fileName) return handleError("fileName is required", res, 400)
    const result = await deleteImageService(fileName)
    return handleSuccess(result, res)
  } catch (e) {
    return handleError(e.message, res)
  }
}