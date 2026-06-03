import { getCompanyByUserId } from "../services/CompanyService.js";
import { createTemplateService, deleteTemplateService, generateAnswarePDFService, getArchivedTemplatesService, getTemplateByIdService, getTemplatesService, toggleArchiveTemplateService, updateTemplateService } from "../services/templateService.js";
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
    return handleError(e.message, res)
  }
}

export async function getArchivedTemplatesController(req, res) {
  try {
    let company = undefined
    if(req.body.user_id){
      company = await getCompanyByUserId(req.body.user_id)
    }

    const templates = await getArchivedTemplatesService(company ? company.code : -1)
    return handleSuccess(templates, res)
  } catch (e) {
    return handleError(e.message, res)
  }
}

export async function getTemplateByIdController(req, res) {
  try {
    const templates = await getTemplateByIdService(req.params.id)
    return handleSuccess(templates, res)
  } catch (e) {
    return handleError(e.message, res)
  }
}

export async function updateTemplateController(req, res) {
  try {
    const { tId, template, user_id } = req.body;
    const updatedTemplate = await updateTemplateService(tId, template, user_id)
    return handleSuccess(updatedTemplate, res)
  } catch (e) {
    return handleError(e.message, res)
  }
}

export async function deleteTemplateController(req, res) {
  try {
    const { tId, user_id } = req.body;
    const deletedTemplate = await deleteTemplateService(tId, user_id)
    return handleSuccess(deletedTemplate, res)
  } catch (e) {
    return handleError(e.message, res)
  }
}

export async function generateAnswarePDFController(req, res) {
  try {
    const { answare_id, userid } = req.method === 'GET' ? req.query : req.body;
    const pdfBuffer = await generateAnswarePDFService(answare_id, userid)



    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=form.pdf");
    res.end(pdfBuffer);
    
  } catch (e) {
    console.error('handle: ', e)
    return handleError(e.message, res)
  }
}

export async function toggleArchiveTemplateController(req, res) {
  try {
    const { tId } = req.body;
    
    const template = await toggleArchiveTemplateService(tId)
    
    return handleSuccess(template, res)
  } catch (err) {
    return handleError(err.message, res)
  }
}
