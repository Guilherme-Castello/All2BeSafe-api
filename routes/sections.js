import express from "express";
import { deleteSectionsController, listSectionsController, newSectionController } from "../controllers/SectionController.js";

const router = express.Router();

router.post('/newSection', newSectionController);
router.post('/listSections', listSectionsController);
router.post('/deleteSection', deleteSectionsController);

export default router;
