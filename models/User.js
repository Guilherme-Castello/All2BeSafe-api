import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
  access_level: { type: String, required: true },
  email: {type: String, required: true, unique: true},
  company: { type: Number, required: true, ref: "Company" },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);