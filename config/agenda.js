/**
 * Singleton do Agenda.js — fila de jobs via MongoDB.
 *
 * Substitui BullMQ + Redis: usa a mesma instância MongoDB já presente
 * na stack, eliminando a dependência do Upstash/Redis.
 *
 * Conexão: Agenda abre sua própria conexão leve ao MongoDB usando MONGO_URL.
 * Os jobs ficam na collection `agenda_pdf_jobs`.
 *
 * Para ativar o processamento, chame `await agenda.start()` após a conexão
 * do Mongoose (ver server.js).
 */
// agenda@4 é CJS — o default export é a classe Agenda
import Agenda from 'agenda';

if (!process.env.MONGO_URL) {
  console.error('❌ MONGO_URL não definida. Agenda não funcionará.');
}

const agenda = new Agenda({
  db: {
    address: process.env.MONGO_URL,
    collection: 'agenda_pdf_jobs',
  },
  // Intervalo de varredura por novos jobs no MongoDB.
  // 5 s é suficiente para PDFs assíncronos sem gerar carga relevante.
  processEvery: '5 seconds',
  // Máximo de jobs de PDF rodando em paralelo (limita uso de RAM/CPU no Render).
  maxConcurrency: 2,
  defaultConcurrency: 1,
});

agenda.on('ready', () =>
  console.log('[Agenda] Conectado ao MongoDB e pronto para processar jobs')
);
agenda.on('error', (err) =>
  console.error('[Agenda] Erro de conexão:', err.message)
);

export default agenda;
