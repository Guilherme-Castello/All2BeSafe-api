import { getImageSignedUrlService, uploadImageService } from "../services/imageService.js";
import { handleError, handleSuccess } from "../utils/httpResponse.js";

export async function uploadImageController(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });

    const uploadedImage = await uploadImageService(req)
    if (!uploadedImage.success) throw new Error("Internal error (Image Upload)")

    const imageLink = await getImageSignedUrl(uploadedImage.message)
    console.log(imageLink)

    handleSuccess({imageLink, fileName: uploadedImage.message}, res)
  } catch (e) {
    console.error(e);
    handleError(e)
  }
}

export async function getImageUrlController(req, res) {
  try {
    const url = await getImageSignedUrlService(req.body.fileName)
    handleSuccess(url, res)
  } catch (e) {
    handleError(e, res)
  }
}