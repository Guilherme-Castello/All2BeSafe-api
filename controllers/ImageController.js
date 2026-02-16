import { getImageSignedUrlService, uploadImageService } from "../services/imageService.js";
import { handleError, handleSuccess } from "../utils/httpResponse.js";

export async function uploadImageController(req, res) {
  console.log("GOT HERE")
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });

    const uploadedImage = await uploadImageService(req)
    if (!uploadedImage.success) throw new Error("Internal error (Image Upload)")

    const imageLink = await getImageSignedUrlService(uploadedImage.message)
    console.log(imageLink)

    // return handleSuccess({imageLink, fileName: uploadedImage.message}, res)
    res.status(200).json({imageLink, fileName: uploadedImage.message, success: true})
    console.log('after')
  } catch (e) {
    console.error(e);
    res.status(500).json({error: e.message})
  }
}

export async function getImageUrlController(req, res) {
  console.log(req.body)
  console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
  try {
    const url = await getImageSignedUrlService(req.body.fileName)
    handleSuccess(url, res)
  } catch (e) {
    handleError(e, res)
  }
}