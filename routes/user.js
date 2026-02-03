import express from "express";
import User from "../models/User.js"; 
import bcrypt from "bcrypt";
import { createUser } from "../controllers/User.js";

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ error: 'Usuário não encontrado' });
    }

    // compara a senha com o hash
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(200).json({ error: 'Senha incorreta' });
    }

    const userWithoutPassword = user.toObject()
    delete  userWithoutPassword.password
    res.status(200).json({ message: 'Login realizado com sucesso!', user: userWithoutPassword });
    console.log(userWithoutPassword)
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const createdUser = await createUser(req.body)
    res.status(201).json(createdUser);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;
