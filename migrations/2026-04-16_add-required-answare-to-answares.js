/**
 * Migration: 2026-04-16_add-required-answare-to-answares
 *
 * Objetivo:
 *   Adicionar o campo `required_answare` (Boolean, default false) a cada item
 *   dentro do array `answares` de todos os documentos Answare existentes no banco.
 *
 * Quando rodar:
 *   Sempre que o campo `required_answare` for adicionado ao AnswareItem schema
 *   e existirem documentos Answare criados antes dessa alteração.
 *
 * Como rodar:
 *   node migrations/2026-04-16_add-required-answare-to-answares.js
 *
 * Segurança:
 *   - Usa `$exists: false` para tocar APENAS nos itens que ainda não possuem o campo.
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
  const collection = db.collection('answares');

  // Conta quantos answares possuem ao menos um item sem o campo
  const affected = await collection.countDocuments({
    'answares.required_answare': { $exists: false }
  });

  console.log(`📋 Answares com itens sem required_answare: ${affected}`);

  if (affected === 0) {
    console.log('✅ Nenhum documento precisa de migração. Encerrando.');
    await mongoose.disconnect();
    return;
  }

  // Atualiza apenas os itens do array que ainda não possuem o campo
  const result = await collection.updateMany(
    { 'answares.required_answare': { $exists: false } },
    { $set: { 'answares.$[item].required_answare': false } },
    { arrayFilters: [{ 'item.required_answare': { $exists: false } }] }
  );

  console.log(`✅ Answares atualizados : ${result.modifiedCount}`);
  console.log(`   Documentos verificados: ${result.matchedCount}`);

  await mongoose.disconnect();
  console.log('🔌 Desconectado do MongoDB');
}

run().catch(err => {
  console.error('❌ Erro na migração:', err.message);
  process.exit(1);
});
