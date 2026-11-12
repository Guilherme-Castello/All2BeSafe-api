import { getCompanyByUserId } from "../services/CompanyService.js";
import { createTemplateService, deleteTemplateService, generateAnswarePDFService, getArchivedTemplatesService, getTemplateByIdService, getTemplatesByCompanyService, getTemplatesService, toggleArchiveTemplateService, updateTemplateService } from "../services/templateService.js";
import { handleError, handleSuccess } from "../utils/httpResponse.js";
import { pdfQueue } from "../queues/pdfQueue.js";
import { generateAndStoreAnswarePDFService } from "../services/pdfService.js";

const PDF_QUEUE_READY_TIMEOUT_MS = 5000;

async function withTimeout(promise) {
  let timeout;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Redis timeout')), PDF_QUEUE_READY_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

async function isPdfQueueReady() {
  try {
    await withTimeout(pdfQueue.waitUntilReady());
    return true;
  } catch {
    return false;
  }
}

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
 * Enfileira um job de geração de PDF e retorna imediatamente com { jobId }.
 * O app usa GET /pdfStatus/:jobId para acompanhar o progresso.
 */
export async function generateAnswarePDFController(req, res) {
  try {
    const { answare_id, userid } = req.method === 'GET' ? req.query : req.body;
    if (!answare_id || !userid) return handleError('answare_id e userid são obrigatórios', res, 400);

    if (await isPdfQueueReady()) {
      const job = await pdfQueue.add('generate', { answareid: answare_id, userid });
      return handleSuccess({ jobId: job.id, status: 'queued' }, res);
    }

    console.warn('[generateAnswarePDFController] Redis indisponível; gerando PDF sem fila.');
    const fileKey = `direct-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const { signedUrl, fileName } = await generateAndStoreAnswarePDFService(answare_id, userid, fileKey);
    return handleSuccess({ status: 'done', url: signedUrl, fileName }, res);
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
    const job = await pdfQueue.getJob(jobId);
    if (!job) return handleError('Job não encontrado', res, 404);

    const state = await job.getState();

    if (state === 'completed') {
      const { signedUrl } = job.returnvalue;
      return handleSuccess({ status: 'done', url: signedUrl }, res);
    }

    if (state === 'failed') {
      return handleSuccess({ status: 'error', message: job.failedReason }, res);
    }

    // 'waiting', 'active', 'delayed', 'waiting-children'
    return handleSuccess({ status: state === 'active' ? 'processing' : 'queued' }, res);
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
