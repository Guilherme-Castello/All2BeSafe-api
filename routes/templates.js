import express from "express";
import { createTemplateController, deleteTemplateController, generateAnswarePDFController, getArchivedTemplatesController, getTemplateByIdController, getTemplatesController, toggleArchiveTemplateController, updateTemplateController } from "../controllers/TemplateController.js";

const router = express.Router();

router.post('/', createTemplateController);
router.post('/getAll', getTemplatesController);
router.post('/getArchived', getArchivedTemplatesController);
router.post('/generateAnswarePDF', generateAnswarePDFController)
router.get('/generateAnswarePDF', generateAnswarePDFController)
router.post('/toggleArchive', toggleArchiveTemplateController)
router.post('/update', updateTemplateController)
router.post('/delete', deleteTemplateController)
router.get('/:id', getTemplateByIdController);

export default router;
