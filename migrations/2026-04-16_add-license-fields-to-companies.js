/**
 * Migration: 2026-04-16_add-license-fields-to-companies
 *
 * Objetivo:
 *   Adicionar os campos de licença (plan_name, plan_seats, subscription_status,
 *   subscription_end, is_active, notes) a todos os documentos Company existentes
 *   que ainda não possuem esses campos.
 *
 * Como rodar:
 *   node migrations/2026-04-16_add-license-fields-to-companies.js
 *
 * Segurança:
 *   - Usa $exists: false — idempotente, seguro de rodar mais de uma vez.
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const MONGO_URL = process.env.MONGO_URL;
if (!MONGO_URL) { console.error('❌ MONGO_URL não encontrada'); process.exit(1); }

async function run() {
  await mongoose.connect(MONGO_URL);
  console.log('✅ Conectado ao MongoDB');

  const collection = mongoose.connection.db.collection('companies');

  const affected = await collection.countDocuments({ is_active: { $exists: false } });
  console.log(`📋 Companies sem campos de licença: ${affected}`);

  if (affected === 0) {
    console.log('✅ Nenhum documento precisa de migração.');
    await mongoose.disconnect();
    return;
  }

  const result = await collection.updateMany(
    { is_active: { $exists: false } },
    {
      $set: {
        plan_name:           'trial',
        plan_seats:          5,
        subscription_status: 'trialing',
        subscription_end:    null,
        is_active:           true,
        notes:               '',
      }
    }
  );

  console.log(`✅ Companies atualizadas: ${result.modifiedCount}`);
  await mongoose.disconnect();
  console.log('🔌 Desconectado');
}

run().catch(err => { console.error('❌ Erro:', err.message); process.exit(1); });
