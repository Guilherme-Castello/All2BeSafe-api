import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
  // ── Identificação ─────────────────────────────────────────────────────────
  name:      { type: String, required: true, unique: true },
  in_charge: { type: String, required: false },
  code:      { type: Number, required: true, unique: true },

  // ── Licença / Subscription (controle manual) ───────────────────────────────
  plan_name: {
    type: String,
    enum: ['trial', 'starter', 'professional', 'enterprise'],
    default: 'trial'
  },
  plan_seats: { type: Number, default: 5 },

  subscription_status: {
    type: String,
    enum: ['trialing', 'active', 'past_due', 'canceled', 'unpaid'],
    default: 'trialing'
  },
  subscription_end: { type: Date, default: null },

  // ── Controle de acesso ─────────────────────────────────────────────────────
  is_active: { type: Boolean, default: true },

  // ── Notas internas (admin) ─────────────────────────────────────────────────
  notes: { type: String, default: '' },

  created_at: { type: Date, default: Date.now }
});

CompanySchema.index({ name: 1 }, { unique: true });
CompanySchema.index({ code: 1 }, { unique: true });

export default mongoose.model('Company', CompanySchema);
