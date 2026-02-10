import { createNewAnswareService, getAnswaredTemplateService, getUserAnswaresService, updateAnswareService } from "../services/answareService.js";
import { handleError, handleSuccess } from "../utils/httpResponse.js";

export async function getAnswaredTemplateController(req, res) {
  try {
    const { aId } = req.body;

    const answaredTemplate = await getAnswaredTemplateService(aId)

    return handleSuccess(answaredTemplate, res)
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
      template_id: a.template_id._id,
      config: a.template_id.config,
      name: a.name,
      status: a.status
    }));

    return handleSuccess(configs, res)
  } catch (err) {
    return handleError(err, res)
  }
}

export async function createNewAnswareController(req, res) {
  try {
    const answare = await createNewAnswareService(req.body)

    return handleSuccess(answare, res)
  } catch (err) {
    return handleError(err, res)
  }
}

export async function updateAnswareController(req, res) {
  try {
    const { aId, updatedAnware } = req.body;

    const answare = await updateAnswareService(aId, updatedAnware)

    if (!answare) {
      return res.status(404).json({ message: 'Answare not found' });
    }
    const finalAnsware = {...answare, message: "Answare saved!!"}
    return handleSuccess(finalAnsware, res)
  } catch (err) {
    return handleError(err, res)
  }
}