import mongoose from "mongoose";

const ActionSchema = new mongoose.Schema({
  answare_id:       { type: String, required: true },
  question_id:      { type: String, required: true },
  template_id:      { type: String },
  company_code:     { type: Number, required: true },
  created_by:       { type: String, required: true },

  title:            { type: String, required: true, maxlength: 200 },
  description:      { type: String, default: '' },

  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'LOW',
    required: true,
  },

  status: {
    type: String,
    enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'UNABLE_TO_COMPLETE'],
    default: 'TODO',
    required: true,
  },

  due_at:           { type: Date },
  responsible_name: { type: String, default: '' },

  // Soft delete
  deleted_at:       { type: Date, default: null },
  deleted_by:       { type: String, default: null },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

// Índice principal: listar actions de um answare (ou de uma pergunta específica)
ActionSchema.index({ answare_id: 1, question_id: 1 });
ActionSchema.index({ answare_id: 1 });
// Índice de suporte a dashboards futuros por empresa e status
ActionSchema.index({ company_code: 1, status: 1 });

export default mongoose.model('Action', ActionSchema);
