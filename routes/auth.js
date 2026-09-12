import express from "express";
import { forgotPasswordController, publicSignupController, resetPasswordController } from "../controllers/AuthController.js";

const router = express.Router();

router.post('/public-signup', publicSignupController);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password', resetPasswordController);

export default router;
