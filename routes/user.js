import express from "express";
import { userLoginController, userRegistryController } from "../controllers/UserController.js";

const router = express.Router();

router.post('/login', userLoginController);
router.post('/register', userRegistryController);

export default router;
