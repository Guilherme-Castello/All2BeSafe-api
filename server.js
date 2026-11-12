import 'dotenv/config';

//  Modules
import bodyParser from 'body-parser';
import compression from 'compression';
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';

//  Workers (inicializar antes das rotas para garantir que a fila esteja ativa)
import './workers/pdfWorker.js';

//  Routes
import auth from './routes/auth.js'
import user from './routes/user.js'
import templates from './routes/templates.js'
import answares from './routes/answares.js'
import companies from './routes/companies.js'
import images from './routes/images.js'
import sections from './routes/sections.js'

const app = express();
app.use(cors());
// Comprime respostas HTTP com gzip/deflate — reduz drasticamente o tráfego
// em endpoints de listagem (templates, answares, users).
app.use(compression());
app.use(bodyParser.json({ limit: '5mb' }));

// Conexão com MongoDB Atlas
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Conectado ao MongoDB com sucesso!'))
.catch(err => {
  console.error('❌ Erro ao conectar ao MongoDB:', err.message);
  process.exit(1);
});

// Rotas
app.use('/api/templates', templates);
app.use('/api/auth', auth);
app.use('/api/users', user);
app.use('/api/answares', answares);
app.use('/api/companies', companies);
app.use('/api/images', images);
app.use('/api/sections', sections);

// Inicialização do servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
