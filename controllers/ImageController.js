import { deleteImageService, getImageSignedUrlService, uploadImageService } from "../services/imageService.js";
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