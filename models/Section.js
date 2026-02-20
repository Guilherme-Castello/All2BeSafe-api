import mongoose from "mongoose";

const SectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
}); 

export default mongoose.model('Section', SectionSchema);