import { deleteImageController, getImageUrlController, getUploadUrlController, uploadImageController } from "../controllers/ImageController.js";
import express from "express";
import multer from "multer";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only images allowed"));
    }
    cb(null, true);
  },
});

router.post("/uploadImage", upload.single("file"), uploadImageController); // legado — mantido para compatibilidade
router.post("/getUploadUrl", getUploadUrlController);                       // novo — URL pré-assinada para upload direto ao GCS
router.post("/getImageUrl", getImageUrlController);
router.post("/deleteImage", deleteImageController);

export default router;