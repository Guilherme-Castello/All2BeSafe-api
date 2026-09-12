import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
  access_level: { type: String, required: true },
  email: {type: String, required: true, unique: true},
  company: { type: Number, required: true, ref: "Company" },
  created_at: { type: Date, default: Date.now },

  // ── Recuperação de senha (código de 6 dígitos) ─────────────────────────────
  reset_token: { type: String, default: null },
  token_expires_at: { type: Date, default: null }
});

export default mongoose.model('User', UserSchema);