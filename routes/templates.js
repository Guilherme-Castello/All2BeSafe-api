import express from "express";
import { createTemplateController, generateAnswarePDFController, getTemplateByIdController, getTemplatesController } from "../controllers/TemplateController.js";

const router = express.Router();

router.post('/', createTemplateController);
router.post('/getAll', getTemplatesController);
router.get('/:id', getTemplateByIdController);
router.post('/generateAnswarePDF', generateAnswarePDFController)

export default router;