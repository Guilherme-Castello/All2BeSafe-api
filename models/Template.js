import mongoose from "mongoose";

const TemplateItemCheckBoxesSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
  id: { type: String, required: true },
}, { _id: false });


const TemplateItemSchema = new mongoose.Schema({
  kind: { type: String, required: true },
  title: { type: String, required: true },
  section: { type: String, required: false},
  options: [{ type: String }],
  check_boxes: [TemplateItemCheckBoxesSchema],
  id: {type: String, required: true},
  value: { type: String }, // Armazenar o valor | Importante armazenar por conta de campos como date e time
}, { _id: false });

const TemplateConfig = new mongoose.Schema({
  name: {type: String, required: true},
  description: {type: String, required: true},
  in_charge: {type: String, required: true},
  weather: {type: Boolean, required: true},
  location: {type: Boolean, required: true}
})

const TemplateSchema = new mongoose.Schema({
  questions: [TemplateItemSchema],
  created_at: { type: Date, default: Date.now },
  config: TemplateConfig
});

export default mongoose.model('Template', TemplateSchema);