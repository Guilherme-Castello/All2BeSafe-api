/**
 * Migration: 2026-04-16_add-status-to-templates
 *
 * Objetivo:
 *   Adicionar o campo `status` (String, default 'open') a todos os documentos Template
 *   existentes no banco que ainda não possuem esse campo.
 *
 * Quando rodar:
 *   Sempre que o campo `status` for adicionado ao TemplateSchema
 *   e existirem documentos Template criados antes dessa alteração.
 *
 * Como rodar:
 *   node migrations/2026-04-16_add-status-to-templates.js
 *
 * Segurança:
 *   - Usa `$exists: false` para tocar APENAS nos documentos que ainda não possuem o campo.
 *   - Idempotente: rodar duas vezes não altera documentos já migrados.
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
  const collection = db.collection('templates');

  // Conta quantos templates não possuem o campo status
  const affected = await collection.countDocuments({
    status: { $exists: false }
  });

  console.log(`📋 Templates sem campo status: ${affected}`);

  if (affected === 0) {
    console.log('✅ Nenhum documento precisa de migração. Encerrando.');
    await mongoose.disconnect();
    return;
  }

  // Atualiza os documentos que não possuem o campo status
  const result = await collection.updateMany(
    { status: { $exists: false } },
    { $set: { status: 'open' } }
  );

  console.log(`✅ Templates atualizados : ${result.modifiedCount}`);
  console.log(`   Documentos verificados: ${result.matchedCount}`);

  await mongoose.disconnect();
  console.log('🔌 Desconectado do MongoDB');
}

run().catch(err => {
  console.error('❌ Erro na migração:', err.message);
  process.exit(1);
});