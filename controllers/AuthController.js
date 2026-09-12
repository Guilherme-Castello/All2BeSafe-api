import { publicSignupService, requestPasswordRecoveryService, resetPasswordService } from "../services/authService.js";
import { handleError, handleSuccess } from "../utils/httpResponse.js";

// Erros de negócio voltam com status 200 + success:false (mesmo padrão do
// login), para que o app só precise checar `response.success`.
function handleAuthError(e, res) {
  return handleError(e.message, res, e.isUserError ? 200 : 500)
}

export async function publicSignupController(req, res) {
  try {
    const { name, email, password } = req.body;

    const { user, company } = await publicSignupService({ name, email, password })

    return handleSuccess({ message: 'Account created successfully!', user, company }, res);
  } catch (e) {
    return handleAuthError(e, res)
  }
}

export async function forgotPasswordController(req, res) {
  try {
    const { email } = req.body;

    await requestPasswordRecoveryService(email)

    // Resposta genérica de propósito: não revelamos se o e-mail tem conta.
    return handleSuccess({ message: 'If this email is registered, you will receive a recovery code shortly.' }, res);
  } catch (e) {
    return handleAuthError(e, res)
  }
}

export async function resetPasswordController(req, res) {
  try {
    const { email, code, password } = req.body;

    const result = await resetPasswordService({ email, code, password })

    return handleSuccess(result, res);
  } catch (e) {
    return handleAuthError(e, res)
  }
}
