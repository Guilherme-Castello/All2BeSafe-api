/**
 * Migration: 2026-11-17_add-action-indexes
 *
 * Objetivo:
 *   Garantir que as collections `actions` e `action_activities` existam no MongoDB
 *   e que seus índices estejam criados.
 *
 *   Esta migration é puramente aditiva: não altera nenhum documento existente.
 *   As collections são criadas automaticamente pelo Mongoose ao primeiro uso,
 *   mas os índices precisam ser confirmados em produção.
 *
 * Como rodar:
 *   node migrations/2026-11-17_add-action-indexes.js
 *
 * Segurança:
 *   - Idempotente: `createIndex` com mesma definição é ignorado se já existir.
 *   - Não remove índices existentes.
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error('❌ MONGO_URL não encontrada no .env');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URL);
  console.log('✅ Conectado ao MongoDB');

  const db = mongoose.connection.db;

  // ── actions ──────────────────────────────────────────────────────────────
  const actionsCol = db.collection('actions');

  await actionsCol.createIndex({ answare_id: 1, question_id: 1 });
  console.log('✅ Índice criado: actions { answare_id, question_id }');

  await actionsCol.createIndex({ answare_id: 1 });
  console.log('✅ Índice criado: actions { answare_id }');

  await actionsCol.createIndex({ company_code: 1, status: 1 });
  console.log('✅ Índice criado: actions { company_code, status }');

  // ── action_activities ─────────────────────────────────────────────────────
  const activitiesCol = db.collection('action_activities');

  await activitiesCol.createIndex({ action_id: 1, created_at: 1 });
  console.log('✅ Índice criado: action_activities { action_id, created_at }');

  await mongoose.disconnect();
  console.log('🔌 Desconectado do MongoDB');
}

run().catch(err => {
  console.error('❌ Erro na migração:', err.message);
  process.exit(1);
});
