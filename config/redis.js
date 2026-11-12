/**
 * Conexão Redis compartilhada entre a Queue (BullMQ) e o Worker.
 * Requer a variável de ambiente REDIS_URL (ex.: UpStash ou Redis Cloud).
 *
 * Formato UpStash: rediss://default:<password>@<host>:<port>
 *
 * maxRetriesPerRequest: null é obrigatório pelo BullMQ.
 */
import { Redis } from 'ioredis';

if (!process.env.REDIS_URL) {
  console.error('❌ REDIS_URL não definida. PDF assíncrono não funcionará.');
}

const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  // TLS automático para URLs rediss://
  tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
});

connection.on('error', (err) => {
  console.error('[Redis] Erro de conexão:', err.message);
});

export default connection;
