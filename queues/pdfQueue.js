/**
 * Fila de geração de PDFs — Agenda.js (MongoDB).
 *
 * Substitui a fila BullMQ + Redis anterior.
 * Os jobs são armazenados na collection `agenda_pdf_jobs` do MongoDB Atlas.
 *
 * API pública:
 *   enqueuePdfJob(answareid, userid)  → Promise<string>  (jobId UUID)
 *   getPdfJobStatus(jobId)            → Promise<{ status, url?, message? }>
 */
import { randomUUID } from 'crypto';
import agenda from '../config/agenda.js';

/**
 * Enfileira um job de geração de PDF para execução imediata.
 * O job é identificado por um UUID gerado aqui (não pelo _id do MongoDB),
 * o que simplifica consultas e evita manipulação de ObjectId.
 *
 * @param {string} answareid
 * @param {string} userid
 * @returns {Promise<string>} jobId (UUID)
 */
export async function enqueuePdfJob(answareid, userid) {
  const jobId = randomUUID();
  await agenda.now('generate-pdf', { jobId, answareid, userid });
  return jobId;
}

/**
 * Consulta o status de um job de PDF pelo jobId (UUID).
 *
 * Estados possíveis:
 *   'queued'     — job criado, aguardando processamento
 *   'processing' — worker em execução
 *   'done'       — PDF gerado; url contém a URL GCS assinada
 *   'error'      — falha; message descreve o erro
 *
 * @param {string} jobId
 * @returns {Promise<{ status: string, url?: string, message?: string }>}
 */
export async function getPdfJobStatus(jobId) {
  const jobs = await agenda.jobs({ 'data.jobId': jobId });

  if (!jobs.length) {
    return { status: 'error', message: 'Job não encontrado ou expirado' };
  }

  const { attrs } = jobs[0];

  // Job falhou em todas as tentativas
  if (attrs.failedReason) {
    return { status: 'error', message: attrs.failedReason };
  }

  // Job concluído com sucesso — resultado salvo em attrs.data.result
  if (attrs.lastFinishedAt && attrs.data?.result?.signedUrl) {
    return { status: 'done', url: attrs.data.result.signedUrl };
  }

  // Worker travou o job (lockedAt != null) — está em execução
  if (attrs.lockedAt) {
    return { status: 'processing' };
  }

  // Aguardando na fila
  return { status: 'queued' };
}
