import { createNewAnswareController, getAnswaredTemplateController, getUserAnswaresController, updateAnswareController } from "../controllers/AnswareController.js";
import express from "express";

const router = express.Router();

router.post('/getAnswaredTemplate', getAnswaredTemplateController);
router.post('/getUserAnswares', getUserAnswaresController);
router.post('/answare', createNewAnswareController)
router.post('/updateAnsware', updateAnswareController);

export default router;
