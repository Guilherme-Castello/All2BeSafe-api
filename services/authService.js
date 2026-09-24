import crypto from "crypto";
import User from "../models/User.js";
import Company from "../models/Company.js";
import { getHashedPassword, getUserWithoutPassword, verifyPassword } from "./userService.js";
import { sendRecoveryEmail } from "./emailService.js";
import { userError } from "../utils/errors.js";

// Nível de acesso concedido a quem se cadastra pelo app (1 = Form Creator:
// pode criar, editar e responder formulários).
export const PUBLIC_SIGNUP_ACCESS_LEVEL = '1'

// Prefixo do nome da empresa pessoal criada automaticamente no cadastro.
const PERSONAL_COMPANY_PREFIX = 'Personal - '

// Validade do código de recuperação: 15 minutos.
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Reexportado para não quebrar quem já importa `userError` a partir daqui.
export { userError };

/**
 * Busca um usuário pelo e-mail ignorando maiúsculas/minúsculas.
 * O login atual faz busca exata, então NÃO normalizamos o e-mail gravado —
 * esta busca tolerante é usada apenas nos fluxos novos (cadastro/recuperação).
 */
export async function getUserByEmailInsensitive(email) {
  const user = await User.findOne({
    email: { $regex: `^${escapeRegex(String(email).trim())}$`, $options: 'i' }
  })

  return user
}

/**
 * Próximo código livre para uma nova empresa.
 * O código 0 é reservado para o super-admin, por isso começamos em 1.
 */
async function getNextCompanyCode() {
  const lastCompany = await Company.findOne().sort({ code: -1 })
  const lastCode = lastCompany ? Number(lastCompany.code) : 0

  return (Number.isFinite(lastCode) ? lastCode : 0) + 1
}

/**
 * Cria a empresa pessoal "Personal - [Nome]" do usuário que se cadastrou.
 * `name` e `code` são únicos no schema, então tentamos algumas vezes para
 * contornar homônimos e corridas entre cadastros simultâneos.
 */
export async function createPersonalCompany(userName) {
  const baseName = `${PERSONAL_COMPANY_PREFIX}${userName}`

  for (let attempt = 1; attempt <= 10; attempt++) {
    const name = attempt === 1 ? baseName : `${baseName} (${attempt})`

    try {
      const company = new Company({
        name,
        in_charge: userName,
        code: await getNextCompanyCode(),
        is_personal: true,
        notes: 'Created automatically by public sign up.'
      })
      await company.save()

      return company
    } catch (e) {
      // E11000 = nome ou código duplicado: tenta de novo com o próximo sufixo/código.
      if (!String(e.message).includes('E11000')) throw e
    }
  }

  throw userError('Could not create the personal company. Please try again.')
}

/**
 * Cadastro público: cria a empresa pessoal e o usuário vinculado a ela
 * com nível 1 (Form Creator).
 */
export async function publicSignupService({ name, email, password }) {
  const cleanName = String(name ?? '').trim()
  // Mantemos o e-mail como o usuário digitou (só sem espaços nas pontas)
  // porque o login faz comparação exata.
  const cleanEmail = String(email ?? '').trim()

  if (!cleanName || !cleanEmail || !password) {
    throw userError('Name, email and password are required')
  }

  if (!EMAIL_REGEX.test(cleanEmail)) {
    throw userError('Please inform a valid email address')
  }

  if (String(password).length < 6) {
    throw userError('Password must be at least 6 characters long')
  }

  const alreadyExists = await getUserByEmailInsensitive(cleanEmail)
  if (alreadyExists) {
    throw userError('Email already taken')
  }

  const company = await createPersonalCompany(cleanName)

  try {
    const user = new User({
      name: cleanName,
      email: cleanEmail,
      password: await getHashedPassword(password),
      access_level: PUBLIC_SIGNUP_ACCESS_LEVEL,
      company: company.code
    })
    await user.save()

    return { user: getUserWithoutPassword(user), company }
  } catch (e) {
    // Não deixa empresa pessoal órfã se a criação do usuário falhar.
    await Company.deleteOne({ _id: company._id })

    if (String(e.message).includes('E11000')) {
      throw userError('Email already taken')
    }
    throw e
  }
}

/**
 * Gera o código de 6 dígitos, grava no usuário e envia por e-mail.
 * Retorna { sent: false } quando o e-mail não existe, para que o controller
 * possa responder de forma genérica e não revelar quem tem conta.
 */
export async function requestPasswordRecoveryService(email) {
  const cleanEmail = String(email ?? '').trim()

  if (!cleanEmail) {
    throw userError('Email is required')
  }

  const user = await getUserByEmailInsensitive(cleanEmail)
  if (!user) {
    return { sent: false }
  }

  // crypto.randomInt é criptograficamente seguro (Math.random não é).
  const code = String(crypto.randomInt(100000, 1000000))

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        reset_token: code,
        token_expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS)
      }
    }
  )

  try {
    await sendRecoveryEmail(user.email, code)
  } catch (e) {
    // Se o envio falhar o código fica inutilizável, então limpamos.
    await User.updateOne(
      { _id: user._id },
      { $unset: { reset_token: "", token_expires_at: "" } }
    )
    console.error('Send recovery email error: ', e)
    throw userError('We could not send the recovery email. Please try again later.')
  }

  return { sent: true }
}

/**
 * Valida o código de recuperação e grava a nova senha (com hash).
 */
export async function resetPasswordService({ email, code, password }) {
  const cleanEmail = String(email ?? '').trim()
  const cleanCode = String(code ?? '').trim()

  if (!cleanEmail || !cleanCode || !password) {
    throw userError('Email, recovery code and new password are required')
  }

  if (String(password).length < 6) {
    throw userError('Password must be at least 6 characters long')
  }

  const user = await getUserByEmailInsensitive(cleanEmail)

  // Mensagem única para e-mail inexistente, código errado e código expirado,
  // para não dar pistas a quem tenta adivinhar.
  const invalidCodeError = userError('Invalid or expired recovery code')

  if (!user || !user.reset_token || !user.token_expires_at) {
    throw invalidCodeError
  }

  if (String(user.reset_token) !== cleanCode) {
    throw invalidCodeError
  }

  if (new Date(user.token_expires_at).getTime() <= Date.now()) {
    throw invalidCodeError
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: { password: await getHashedPassword(password) },
      $unset: { reset_token: "", token_expires_at: "" }
    }
  )

  return { message: 'Password updated successfully' }
}

/**
 * Exclusão definitiva da conta (requisito da Apple, diretriz 5.1.1).
 * Remove o usuário e, quando aplicável, a empresa pessoal dele.
 * A senha atual é exigida para evitar exclusão por terceiros.
 */
export async function deleteOwnAccountService({ userId, password }) {
  if (!userId || !password) {
    throw userError('User and password are required')
  }

  const user = await User.findOne({ _id: userId })
  if (!user) {
    throw userError('User not found')
  }

  const isPasswordCorrect = await verifyPassword(password, user.password)
  if (!isPasswordCorrect) {
    throw userError('Incorrect password')
  }

  await User.deleteOne({ _id: user._id })

  const companyDeleted = await deletePersonalCompanyIfOrphan(user.company)

  return { message: 'Account deleted successfully', company_deleted: companyDeleted }
}

/**
 * Remove a empresa pessoal do usuário excluído.
 * Nunca toca em empresas corporativas nem no código 0 (super-admin): só apaga
 * se a empresa estiver marcada como pessoal E não tiver mais nenhum usuário.
 */
async function deletePersonalCompanyIfOrphan(companyCode) {
  if (companyCode === undefined || companyCode === null) return false
  if (String(companyCode) === '0') return false

  const company = await Company.findOne({ code: companyCode })
  if (!company) return false

  const isPersonal = company.is_personal === true || String(company.name).startsWith(PERSONAL_COMPANY_PREFIX)
  if (!isPersonal) return false

  const remainingUsers = await User.countDocuments({ company: companyCode })
  if (remainingUsers > 0) return false

  await Company.deleteOne({ _id: company._id })

  return true
}
