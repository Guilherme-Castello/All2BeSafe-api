import { getImageUrlController, uploadImageController } from "../controllers/ImageController.js";
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

router.post("/uploadImage", upload.single("file"), uploadImageController);
router.post("/getImageUrl", getImageUrlController)

export default router;