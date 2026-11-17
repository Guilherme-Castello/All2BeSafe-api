import {
  createActionService,
  getActionsByAnswareService,
  getActionByIdService,
  updateActionService,
  updateActionStatusService,
  deleteActionService,
  getActionActivitiesService,
  addActionCommentService,
} from "../services/actionService.js";
import { handleError, handleSuccess } from "../utils/httpResponse.js";

export async function createActionController(req, res) {
  try {
    const { requester_id, answare_id, question_id, title, description, priority, due_at, responsible_name } = req.body;
    const action = await createActionService({
      requester_id, answare_id, question_id, title, description, priority, due_at, responsible_name,
    });
    return handleSuccess({ action }, res);
  } catch (err) {
    return handleError(err.isUserError ? err.message : err, res, err.isUserError ? 200 : 500);
  }
}

export async function getActionsByAnswareController(req, res) {
  try {
    const { requester_id, answare_id } = req.body;
    const actions = await getActionsByAnswareService({ requester_id, answare_id });
    return handleSuccess({ actions }, res);
  } catch (err) {
    return handleError(err.isUserError ? err.message : err, res, err.isUserError ? 200 : 500);
  }
}

export async function getActionByIdController(req, res) {
  try {
    const { requester_id, action_id } = req.body;
    const action = await getActionByIdService({ requester_id, action_id });
    return handleSuccess({ action }, res);
  } catch (err) {
    return handleError(err.isUserError ? err.message : err, res, err.isUserError ? 200 : 500);
  }
}

export async function updateActionController(req, res) {
  try {
    const { requester_id, action_id, title, description, priority, due_at, responsible_name } = req.body;
    const action = await updateActionService({
      requester_id, action_id, title, description, priority, due_at, responsible_name,
    });
    return handleSuccess({ action }, res);
  } catch (err) {
    return handleError(err.isUserError ? err.message : err, res, err.isUserError ? 200 : 500);
  }
}

export async function updateActionStatusController(req, res) {
  try {
    const { requester_id, action_id, status } = req.body;
    const action = await updateActionStatusService({ requester_id, action_id, status });
    return handleSuccess({ action }, res);
  } catch (err) {
    return handleError(err.isUserError ? err.message : err, res, err.isUserError ? 200 : 500);
  }
}

export async function deleteActionController(req, res) {
  try {
    const { requester_id, action_id } = req.body;
    const result = await deleteActionService({ requester_id, action_id });
    return handleSuccess(result, res);
  } catch (err) {
    return handleError(err.isUserError ? err.message : err, res, err.isUserError ? 200 : 500);
  }
}

export async function getActionActivitiesController(req, res) {
  try {
    const { requester_id, action_id, page, limit } = req.body;
    const result = await getActionActivitiesService({ requester_id, action_id, page, limit });
    return handleSuccess(result, res);
  } catch (err) {
    return handleError(err.isUserError ? err.message : err, res, err.isUserError ? 200 : 500);
  }
}

export async function addActionCommentController(req, res) {
  try {
    const { requester_id, action_id, text } = req.body;
    const activity = await addActionCommentService({ requester_id, action_id, text });
    return handleSuccess({ activity }, res);
  } catch (err) {
    return handleError(err.isUserError ? err.message : err, res, err.isUserError ? 200 : 500);
  }
}
