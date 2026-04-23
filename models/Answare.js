import mongoose from "mongoose";

const AnswareCheckbox = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: Boolean, default: false },
  id: { type: String },
}, { _id: false });

const AnswareCoords = new mongoose.Schema({
  latitude: { type: String, required: true },
  longitude: { type: String, required: true },
}, { _id: false, required: false });

const AnswareItem = new mongoose.Schema({
  question_id:       { type: String, required: true },
  question_title:    { type: String },
  question_kind:     { type: String },
  question_section:  { type: String },
  question_options:  [{ type: String }],
  required_answare:  { type: Boolean, default: false },
  answare_text:        { type: String },
  answare_checkboxes:  [AnswareCheckbox],
  answare_coords:      AnswareCoords,
  answare_images:      [{ type: String }],
  answare_note:        { type: String }
}, { _id: false });

const AnswareCompletePercentageSchema = new mongoose.Schema({
  section_name: { type: String, required: true },
  percentage: { type: Number, required: true, default: 0 },
}, { _id: false }
);

const AnswareSchema = new mongoose.Schema({
  template_id:      { type: String, required: true },
  template_config:  { type: mongoose.Schema.Types.Mixed },
  user_id:          { type: String, required: true },
  status:           { type: String, required: true, default: 'open' },
  name:             { type: String, required: true },
  answares:         [AnswareItem],
  complete_percentage: { type: [AnswareCompletePercentageSchema], default: [] },
  created_at:       { type: Date, default: Date.now }
}, {
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});

export default mongoose.model('Answare', AnswareSchema);