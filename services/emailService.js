import nodemailer from "nodemailer";

/**
 * Transporte SMTP (Gmail).
 * Criado sob demanda para que a ausência de EMAIL_USER / EMAIL_PASS não
 * derrube o servidor na inicialização — só quem envia e-mail é afetado.
 */
let transporter = null

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email service is not configured. Set EMAIL_USER and EMAIL_PASS in the environment.")
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        // No Gmail é obrigatório usar uma "App Password" (senha de app),
        // não a senha normal da conta.
        pass: process.env.EMAIL_PASS
      }
    })
  }

  return transporter
}

/**
 * Envia o código de recuperação de senha para o usuário.
 * @param {string} to    E-mail de destino
 * @param {string} code  Código numérico de 6 dígitos
 */
export async function sendRecoveryEmail(to, code) {
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f6f8; padding: 32px;">
    <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #3d6cb2; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 22px; margin: 0;">All 2B Safe</h1>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #333333; font-size: 18px; margin: 0 0 16px 0;">Password recovery</h2>
        <p style="color: #555555; font-size: 15px; line-height: 22px; margin: 0 0 24px 0;">
          We received a request to reset your password. Use the code below in the app to choose a new one:
        </p>
        <div style="text-align: center; margin: 0 0 24px 0;">
          <span style="display: inline-block; background-color: #f4f6f8; color: #3d6cb2; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px 24px; border-radius: 10px;">
            ${code}
          </span>
        </div>
        <p style="color: #555555; font-size: 14px; line-height: 22px; margin: 0 0 8px 0;">
          This code expires in <strong>15 minutes</strong>.
        </p>
        <p style="color: #888888; font-size: 13px; line-height: 20px; margin: 0;">
          If you did not request a password reset, you can safely ignore this e-mail — your password stays unchanged.
        </p>
      </div>
      <div style="background-color: #f4f6f8; padding: 16px; text-align: center;">
        <p style="color: #999999; font-size: 12px; margin: 0;">All 2B Safe · This is an automated message, please do not reply.</p>
      </div>
    </div>
  </div>`

  await getTransporter().sendMail({
    from: `"All 2B Safe" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Your All 2B Safe recovery code: ${code}`,
    text: `Your All 2B Safe password recovery code is ${code}. It expires in 15 minutes.`,
    html
  })
}
