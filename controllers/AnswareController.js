import { getAnswaredFormService, getUserAnswaresService } from "../services/answareService.js";
import { handleError, handleSuccess } from "../utils/httpResponse.js";

export async function getAnswaredFormController(req, res) {
  try {
    const { aId } = req.body;

    const answaredForm = await getAnswaredFormService(aId)

    return handleSuccess(answaredForm, res)
  } catch (err) {
    return handleError(message, res)
  }
}

export async function getUserAnswaresController(req, res) {
  try {
    const { uId } = req.body;

    const result = await getUserAnswaresService(uId)

    const configs = result.map(a => ({
      answare_id: a._id,
      form_id: a.form_id._id,
      config: a.form_id.config,
      name: a.name,
      status: a.status
    }));

    return handleSuccess(configs, res)
  } catch (err) {
    return handleError(err, res)
  }
}