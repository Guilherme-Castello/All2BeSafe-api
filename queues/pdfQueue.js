import { Queue } from 'bullmq';
import connection from '../config/redis.js';

/**
 * Fila de geração de PDFs.
 * Cada job carrega { answareid, userid } e retorna { signedUrl, fileName }.
 */
export const pdfQueue = new Queue('pdf-generation', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 60 * 60 }, // mantém jobs concluídos por 1 hora
    removeOnFail:     { age: 24 * 60 * 60 }, // mantém jobs falhos por 24 h
  },
});
