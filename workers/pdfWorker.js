import { Worker } from 'bullmq';
import connection from '../config/redis.js';
import { generateAndStoreAnswarePDFService } from '../services/pdfService.js';

/**
 * Worker que processa jobs da fila 'pdf-generation'.
 *
 * Para cada job:
 *   1. Gera o PDF buffer (Puppeteer + GCS images + Sharp)
 *   2. Salva o PDF no bucket GCS em pdfs/{jobId}.pdf
 *   3. Gera URL pré-assinada de leitura (60 min) e retorna como resultado
 *
 * concurrency: 2 — no máximo 2 Chromiums simultâneos, evitando OOM.
 */
export const pdfWorker = new Worker(
  'pdf-generation',
  async (job) => {
    const { answareid, userid } = job.data;

    console.log(`[pdfWorker] iniciando job ${job.id} — answare: ${answareid}`);

    const result = await generateAndStoreAnswarePDFService(answareid, userid, job.id);

    console.log(`[pdfWorker] job ${job.id} concluído — ${result.fileName}`);
    return result;
  },
  {
    connection,
    concurrency: 2,
  }
);

pdfWorker.on('failed', (job, err) => {
  console.error(`[pdfWorker] job ${job?.id} falhou (tentativa ${job?.attemptsMade}):`, err.message);
});
