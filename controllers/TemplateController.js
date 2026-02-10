import { createTemplateService, getTemplateByIdService, getTemplatesService } from "../services/templateService.js";
import { handleError, handleSuccess } from "../utils/httpResponse.js";

export async function createTemplateController(req, res) {
  try {
    const novo = await createTemplateService(req.body)
    return handleSuccess(novo, res)
  } catch (e) {
    return handleError(e.message, res)
  }
}

export async function getTemplatesController(req, res) {
  try {
    const templates = await getTemplatesService()
    return handleSuccess(templates, res)
  } catch (e) {
    return handleError(e, res)
  }
}

export async function getTemplateByIdController(req, res) {
  try {
    console.log(req.params)
    const templates = await getTemplateByIdService(req.params.id)
    return handleSuccess(templates, res)
  } catch (e) {
    return handleError(e, res)
  }
}

export async function generateAnswarePDFController(req, res) {
  try {
    const { template_id, userid } = req.body;

    const pdfBuffer = generateAnswarePDFService(template_id, userid)



    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=form.pdf");
    res.end(pdfBuffer);
    
  } catch (e) {
    console.error('handle: ', e)
    console.error(e.message)
  }
}