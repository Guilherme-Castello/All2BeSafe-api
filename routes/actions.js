import express from "express";
import {
  createActionController,
  getActionsByAnswareController,
  getActionByIdController,
  updateActionController,
  updateActionStatusController,
  deleteActionController,
  getActionActivitiesController,
  addActionCommentController,
} from "../controllers/ActionController.js";

const router = express.Router();

router.post('/create',          createActionController);
router.post('/getByAnsware',    getActionsByAnswareController);
router.post('/getById',         getActionByIdController);
router.post('/update',          updateActionController);
router.post('/updateStatus',    updateActionStatusController);
router.post('/delete',          deleteActionController);
router.post('/getActivities',   getActionActivitiesController);
router.post('/addComment',      addActionCommentController);

export default router;
