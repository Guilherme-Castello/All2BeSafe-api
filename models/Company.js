import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  in_charge: { type: String, required: false },
  code: {type: String, require: true, default: "0001"},
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Company', CompanySchema);