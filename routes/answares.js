import express from "express";
import Answare from "../models/Answare.js";
import Formulario from "../models/Formulario.js";
import { answareForm } from "../utils/fillForm.js";

const router = express.Router();

router.post('/getAnswaredForm', async (req, res) => {
  try {
    const { aId } = req.body;

    const answare = await Answare.findById(aId);
    const form = await Formulario.findById(answare.form_id);

    const answaredForm = answareForm(form, answare)

    res.json({ message: '200', answaredForm });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/getUserAnswares', async (req, res) => {
  try {
    const { uId } = req.body;

    const result = await Answare
                            .find({ user_id: uId })
                            .select("_id form_id status name")
                            .populate("form_id", "config")
                            .lean();

    const configs = result.map(a => ({
        answare_id: a._id,
        form_id: a.form_id._id,
        config: a.form_id.config,
        name: a.name,
        status: a.status
    }));


    res.json({ message: '200', configs });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});


export default router;
