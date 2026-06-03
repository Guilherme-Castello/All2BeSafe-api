import express from "express";
import { createTemplateController, generateAnswarePDFController, getArchivedTemplatesController, getTemplateByIdController, getTemplatesController, toggleArchiveTemplateController, updateTemplateController } from "../controllers/TemplateController.js";

const router = express.Router();

router.post('/', createTemplateController);
router.post('/getAll', getTemplatesController);
router.post('/getArchived', getArchivedTemplatesController);
router.post('/generateAnswarePDF', generateAnswarePDFController)
router.post('/toggleArchive', toggleArchiveTemplateController)
router.post('/update', updateTemplateController)
router.get('/:id', getTemplateByIdController);

export default router;
