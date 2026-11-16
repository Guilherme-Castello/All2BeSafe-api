import { getCompanyByUserId } from "../services/CompanyService.js";
import { createTemplateService, deleteTemplateService, getArchivedTemplatesService, getTemplateByIdService, getTemplatesByCompanyService, getTemplatesService, toggleArchiveTemplateService, updateTemplateService } from "../services/templateService.js";
import { handleError, handleSuccess } from "../utils/httpResponse.js";
import { enqueuePdfJob, getPdfJobStatus } from "../queues/pdfQueue.js";
import { generateAndStoreAnswarePDFService } from "../services/pdfService.js";

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
    const { user_id, page, limit } = req.body;
    let company = undefined
    if(user_id){
      company = await getCompanyByUserId(user_id)
    }

    const result = await getTemplatesService(company ? company.code : -1, { page, limit })
    return handleSuccess(result, res)
  } catch (e) {
    return handleError(e.message, res)
  }
}

export async function getArchivedTemplatesController(req, res) {
  try {
    const { user_id, page, limit } = req.body;
    let company = undefined
    if(user_id){
      company = await getCompanyByUserId(user_id)
    }

    const result = await getArchivedTemplatesService(company ? company.code : -1, { page, limit })
    return handleSuccess(result, res)
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
    return handleError(e.message, res, e.isUserError ? 200 : 500)
  }
}

export async function deleteTemplateController(req, res) {
  try {
    const { tId, user_id } = req.body;
    const deletedTemplate = await deleteTemplateService(tId, user_id)
    return handleSuccess(deletedTemplate, res)
  } catch (e) {
    return handleError(e.message, res, e.isUserError ? 200 : 500)
  }
}

export async function getTemplatesByCompanyController(req, res) {
  try {
    const { requester_id, company_code, archived } = req.body;
    const templates = await getTemplatesByCompanyService(requester_id, company_code, { archived: !!archived })
    return handleSuccess(templates, res)
  } catch (e) {
    return handleError(e.message, res, e.isUserError ? 200 : 500)
  }
}

/**
 * Enfileira um job de geração de PDF via Agenda (MongoDB) e retorna { jobId }.
 * O app usa GET /pdfStatus/:jobId para acompanhar o progresso.
 * Fallback síncrono caso o Agenda não esteja disponível.
 */
export async function generateAnswarePDFController(req, res) {
  try {
    const { answare_id, userid } = req.method === 'GET' ? req.query : req.body;
    if (!answare_id || !userid) return handleError('answare_id e userid são obrigatórios', res, 400);

    try {
      const jobId = await enqueuePdfJob(answare_id, userid);
      return handleSuccess({ jobId, status: 'queued' }, res);
    } catch (queueErr) {
      console.warn('[generateAnswarePDFController] Agenda indisponível; gerando PDF diretamente.', queueErr.message);
      const fileKey = `direct-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const { signedUrl, fileName } = await generateAndStoreAnswarePDFService(answare_id, userid, fileKey);
      return handleSuccess({ status: 'done', url: signedUrl, fileName }, res);
    }
  } catch (e) {
    console.error('[generateAnswarePDFController]', e);
    return handleError(e.message, res);
  }
}

/**
 * Verifica o status de um job de PDF.
 * Retorna: { status: 'queued' | 'processing' | 'done' | 'error', url?, message? }
 */
export async function getPdfStatusController(req, res) {
  try {
    const { jobId } = req.params;
    const result = await getPdfJobStatus(jobId);

    if (result.status === 'error' && result.message === 'Job não encontrado ou expirado') {
      return handleError('Job não encontrado', res, 404);
    }

    return handleSuccess(result, res);
  } catch (e) {
    return handleError(e.message, res);
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
