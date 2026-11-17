import mongoose from "mongoose";

/**
 * ActionActivity — histórico append-only de cada Action.
 *
 * Tipos de evento:
 *   CREATED              — Action criada
 *   COMMENT              — Anotação manual do usuário (campo `text`)
 *   STATUS_CHANGED       — Mudança de status (previous_value → new_value)
 *   PRIORITY_CHANGED     — Mudança de prioridade
 *   DUE_DATE_CHANGED     — Mudança de prazo
 *   RESPONSIBLE_CHANGED  — Mudança de responsável
 *   UPDATED              — Outros campos alterados (title, description)
 *   DELETED              — Soft delete registrado
 */
const ActionActivitySchema = new mongoose.Schema({
  action_id:        { type: String, required: true },
  company_code:     { type: Number, required: true },

  type: {
    type: String,
    enum: [
      'CREATED',
      'COMMENT',
      'STATUS_CHANGED',
      'PRIORITY_CHANGED',
      'DUE_DATE_CHANGED',
      'RESPONSIBLE_CHANGED',
      'UPDATED',
      'DELETED',
    ],
    required: true,
  },

  // Para eventos COMMENT: texto da anotação
  text:             { type: String, default: '' },

  // Para eventos de alteração: valores anterior e novo
  previous_value:   { type: String, default: '' },
  new_value:        { type: String, default: '' },

  // Autoria — gerado pelo backend, nunca pelo cliente
  created_by:       { type: String, required: true },
  created_by_name:  { type: String, required: true },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false,  // append-only: sem updatedAt
  },
});

// Índice principal: listar atividades de uma action em ordem cronológica
ActionActivitySchema.index({ action_id: 1, created_at: 1 });

export default mongoose.model('ActionActivity', ActionActivitySchema);
