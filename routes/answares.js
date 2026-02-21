import { createNewAnswareController, defineAnswareNoteController, getAnswaredTemplateController, getUserAnswaresController, setAsDoneController, updateAnswareController } from "../controllers/AnswareController.js";
import express from "express";

const router = express.Router();

router.post('/getAnswaredTemplate', getAnswaredTemplateController);
router.post('/getUserAnswares', getUserAnswaresController);
router.post('/answare', createNewAnswareController)
router.post('/updateAnsware', updateAnswareController);
router.post('/setAsDone', setAsDoneController);
router.post('/addNOte', defineAnswareNoteController);

export default router;
