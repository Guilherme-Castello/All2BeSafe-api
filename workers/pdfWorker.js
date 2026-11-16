/**
 * Worker de geração de PDFs — Agenda.js (MongoDB).
 *
 * Substitui o worker BullMQ anterior que dependia de Redis.
 * O processamento é idêntico: recebe { jobId, answareid, userid },
 * gera o PDF via Puppeteer + GCS e persiste a URL assinada de volta
 * no próprio documento do job no MongoDB para ser lida pelo controller.
 *
 * concurrency: 2 — no máximo 2 Chromiums simultâneos, evitando OOM no Render.
 */
import agenda from '../config/agenda.js';
import { generateAndStoreAnswarePDFService } from '../services/pdfService.js';

agenda.define('generate-pdf', { concurrency: 2 }, async (job) => {
  const { jobId, answareid, userid } = job.attrs.data;

  console.log(`[pdfWorker] iniciando job ${jobId} — answare: ${answareid}`);

  const result = await generateAndStoreAnswarePDFService(answareid, userid, jobId);

  // Persiste o resultado no próprio documento do job no MongoDB.
  // O controller lê attrs.data.result ao verificar o status.
  job.attrs.data.result = { signedUrl: result.signedUrl, fileName: result.fileName };
  await job.save();

  console.log(`[pdfWorker] job ${jobId} concluído — ${result.fileName}`);
});

agenda.on('fail:generate-pdf', (err, job) => {
  console.error(`[pdfWorker] job ${job.attrs.data?.jobId} falhou:`, err.message);
});

export default agenda;
