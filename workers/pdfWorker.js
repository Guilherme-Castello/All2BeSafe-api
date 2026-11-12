import { Worker } from 'bullmq';
import connection from '../config/redis.js';
import { generateAnswarePDFService } from '../services/templateService.js';
import { bucket } from '../config/gcs.js';

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

    // 1. Gera o PDF (lógica existente, agora em background)
    const pdfBuffer = await generateAnswarePDFService(answareid, userid);

    // 2. Salva no GCS sob o prefixo pdfs/
    const gcsFileName = `pdfs/${job.id}.pdf`;
    const file = bucket.file(gcsFileName);
    await file.save(pdfBuffer, {
      contentType: 'application/pdf',
      resumable: false,
    });

    // 3. URL pré-assinada válida por 60 minutos para o app baixar diretamente
    const [signedUrl] = await file.generateSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000,
    });

    console.log(`[pdfWorker] job ${job.id} concluído — ${gcsFileName}`);
    return { signedUrl, fileName: gcsFileName };
  },
  {
    connection,
    concurrency: 2,
  }
);

pdfWorker.on('failed', (job, err) => {
  console.error(`[pdfWorker] job ${job?.id} falhou (tentativa ${job?.attemptsMade}):`, err.message);
});
