import mongoose from "mongoose";

const AnswareCheckbox = new mongoose.Schema({
  label: {type: String, required: true},
  value: { type: Boolean, default: false },
  id: {type: String},
}, { _id: false });

const AnswareItem = new mongoose.Schema({
  question_id: {type: String, required: true},
  answare_text: { type: String },
  answare_checkboxes: [AnswareCheckbox],
}, { _id: false });

const AnswareSchema = new mongoose.Schema({
  form_id: { type: String, required: true, ref: "Formulario" },
  user_id: { type: String, required: true},
  status: { type: String, required: true, default: 'open'},
  name: { type: String, required: true},
  answares: [AnswareItem],
  signature: {type: String},
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Answare', AnswareSchema);