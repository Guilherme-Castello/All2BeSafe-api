import express from "express";
import User from "../models/User.js"; 

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password)
    const user = await User.findOne({ email });
    console.log(user)
    if (user == null) {
        console.log('if')
      return res.status(200).json({ error: 'Usuário não encontrado' });
    }

    if (user.password !== password) {
      return res.status(200).json({ error: 'Senha incorreta' });
    }

    res.json({ message: 'Login realizado com sucesso!', user });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    console.log("AAAAAAAAA")
    const novo = new User(req.body);
    await novo.save();
    res.status(201).json(novo);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;
