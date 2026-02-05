import { getAnswaredFormController, getUserAnswaresController } from "../controllers/AnswareController.js";
import express from "express";

const router = express.Router();

router.post('/getAnswaredForm', getAnswaredFormController);
router.post('/getUserAnswares', getUserAnswaresController);


export default router;
