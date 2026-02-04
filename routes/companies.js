import express from "express";
import Company from '../models/Company.js';

const router = express.Router();

router.post('/companyList', async (req, res) => {
  try {
    const companyList = await Company.find()
    res.json({ companyList });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;
