import 'dotenv/config';
import mongoose from 'mongoose';
import Template from '../models/Template.js';

async function validate() {
  await mongoose.connect(process.env.MONGO_URL, {
    dbName: 'formDB',
  });

  const templates = await Template.find();

  for (const tpl of templates) {
    if (!Array.isArray(tpl.questions)) continue;

    const positionsById = {};

    tpl.questions.forEach((q, index) => {
      if (!q?.id) return;

      if (!positionsById[q.id]) {
        positionsById[q.id] = [];
      }

      positionsById[q.id].push(index);
    });

    // Filtra apenas os que aparecem mais de uma vez
    const duplicates = Object.entries(positionsById)
      .filter(([_, indexes]) => indexes.length > 1);

    if (duplicates.length > 0) {
      console.log('Documento com duplicações:', tpl._id.toString());

      for (const [id, indexes] of duplicates) {
        console.log(`ID duplicado: ${id}`);
        console.log(`Índices em questions: ${indexes.join(', ')}`);
      }

      console.log('-----------------------------------');
    }
  }

  await mongoose.disconnect();
}

validate().catch(err => {
  console.error(err);
  process.exit(1);
});