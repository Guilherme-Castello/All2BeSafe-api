import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  in_charge: { type: String, required: false },
  code: {type: Number, required: true, unique: true},
  created_at: { type: Date, default: Date.now }
});

CompanySchema.index({ name: 1 }, { unique: true });
CompanySchema.index({ code: 1 }, { unique: true });

export default mongoose.model('Company', CompanySchema);