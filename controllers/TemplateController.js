import { getCompanyByUserId } from "../services/CompanyService.js";
import { createTemplateService, generateAnswarePDFService, getTemplateByIdService, getTemplatesService } from "../services/templateService.js";
import { getUserById } from "../services/userService.js";
import { handleError, handleSuccess } from "../utils/httpResponse.js";

export async function createTemplateController(req, res) {
  try {
    console.log(req.body)
    const novo = await createTemplateService(req.body)
    return handleSuccess(novo, res)
  } catch (e) {
    return handleError(e.message, res)
  }
}

export async function getTemplatesController(req, res) {
  try {
    let company = undefined
    if(req.body.user_id){
      company = await getCompanyByUserId(req.body.user_id)
    }

    const templates = await getTemplatesService(company ? company.code : -1)
    return handleSuccess(templates, res)
  } catch (e) {
    return handleError(e, res)
  }
}

export async function getTemplateByIdController(req, res) {
  try {
    const templates = await getTemplateByIdService(req.params.id)
    return handleSuccess(templates, res)
  } catch (e) {
    return handleError(e, res)
  }
}

export async function generateAnswarePDFController(req, res) {
  try {
    const { answare_id, userid } = req.body;
    const pdfBuffer = await generateAnswarePDFService(answare_id, userid)



    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=form.pdf");
    res.end(pdfBuffer);
    
  } catch (e) {
    console.error('handle: ', e)
    console.error(e.message)
  }
}