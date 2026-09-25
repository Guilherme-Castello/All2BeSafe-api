import { toggleArchiveController, createNewAnswareController, defineAnswareNoteController, deleteAnswareController, getAnswaredTemplateController, getUserAnswaresController, setAsDoneController, updateAnswareController, getUserArchivedAnswaresController } from "../controllers/AnswareController.js";
import express from "express";

const router = express.Router();

router.post('/getAnswaredTemplate', getAnswaredTemplateController);
router.post('/getUserAnswares', getUserAnswaresController);
router.post('/getUserArchivedAnswares', getUserArchivedAnswaresController);
router.post('/answare', createNewAnswareController)
router.post('/updateAnsware', updateAnswareController);
router.post('/setAsDone', setAsDoneController);
router.post('/addNote', defineAnswareNoteController);
router.post('/toggleArchive', toggleArchiveController);
router.post('/deleteAnsware', deleteAnswareController);

export default router;
