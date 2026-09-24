import User from "../models/User.js";
import Company from "../models/Company.js";
import bcrypt from "bcrypt"
import { userError } from "../utils/errors.js";
import { isSuperAdmin, isCompanyAdmin, belongsToCompany } from "../utils/permissions.js";

export async function getUserByEmail(email) {
  const user = await User.findOne({ email });

  return user
}

export async function getUserById(_id) {
  const user = await User.findOne({_id})

  return user
}

export async function verifyPassword(password, uPassword) {
  const isCorrect = await bcrypt.compare(password, uPassword);

  return isCorrect
}

export function getUserWithoutPassword(user) {
  const userWithoutPassword = user.toObject()
  delete userWithoutPassword.password
  // Dados do fluxo de recuperação de senha nunca saem da API.
  delete userWithoutPassword.reset_token
  delete userWithoutPassword.token_expires_at

  return userWithoutPassword
}

export async function getHashedPassword(password){
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword
}

export async function createUser(userStructure){
  try{
    const user = new User(userStructure);
    await user.save()
    return user
  } catch(e){
    console.error("Create user error: ", e)
    throw new Error(e)
  }
}

/**
 * Impede que um Company Admin (nível 2) gerencie usuários de outra empresa,
 * e que qualquer um abaixo do Super Admin altere quem pode ser Super Admin.
 */
function assertCanManageUser(requester, targetUser) {
  if (isSuperAdmin(requester)) return

  if (!isCompanyAdmin(requester)) {
    throw userError("Usuário sem permissão para gerenciar usuários")
  }

  if (!belongsToCompany(requester, targetUser.company)) {
    throw userError("Usuário sem permissão para gerenciar usuários de outra empresa")
  }
}

/**
 * Remove/valida campos sensíveis (access_level, company) antes de aplicar
 * um update. Só o Super Admin pode conceder nível 3 ou mudar a empresa de alguém.
 */
function sanitizeUserPayload(requester, payload = {}) {
  const { access_level, company, ...rest } = payload
  const sanitized = { ...rest }

  if (access_level !== undefined) {
    if (!isSuperAdmin(requester) && Number(access_level) >= 3) {
      throw userError("Somente o Super Admin pode conceder o nível 3")
    }
    sanitized.access_level = access_level
  }

  if (company !== undefined) {
    if (!isSuperAdmin(requester)) {
      throw userError("Somente o Super Admin pode mover um usuário para outra empresa")
    }
    sanitized.company = company
  }

  return sanitized
}

/**
 * Fluxo administrativo de criação de usuário (tela User Manager).
 * Diferente de `createUser`, que é de uso interno (ex.: script de seed) e
 * não deve ganhar checagens de permissão.
 */
export async function createUserByAdminService(requesterId, userStructure) {
  if (!requesterId) throw userError("Requisitante não informado")

  const requester = await getUserById(requesterId)
  if (!requester) throw userError("Requisitante não encontrado")

  if (!isCompanyAdmin(requester)) {
    throw userError("Usuário sem permissão para criar usuários")
  }

  if (!isSuperAdmin(requester) && Number(userStructure.access_level) >= 3) {
    throw userError("Somente o Super Admin pode conceder o nível 3")
  }

  // Company Admin nunca escolhe empresa: sempre a própria, mesma regra que o app já aplica na UI.
  const company = isSuperAdmin(requester) ? userStructure.company : requester.company

  return await createUser({ ...userStructure, company })
}

export async function userListService(userId) {
  const currentUserRaw = await User.findOne({ _id: userId });
  const currentUser = await getUserWithoutPassword(currentUserRaw)

  let users
  if(currentUser.access_level == 3) {
    users = await User.find()
  } else {
    users = await User.find({company: currentUser.company})
  }

  users = users.map(user => getUserWithoutPassword(user))

  return users
}

export async function userDeleteService(requesterId, userId) {
  if (!requesterId) throw userError("Requisitante não informado")

  const requester = await getUserById(requesterId)
  if (!requester) throw userError("Requisitante não encontrado")

  const target = await getUserById(userId)
  if (!target) throw userError("Usuário não encontrado")

  assertCanManageUser(requester, target)

  const deleted = await User.deleteOne({_id: userId})
  return deleted
}

export async function userUpdateService(requesterId, userId, newUserStructure) {
  if (!requesterId) throw userError("Requisitante não informado")

  const requester = await getUserById(requesterId)
  if (!requester) throw userError("Requisitante não encontrado")

  const target = await getUserById(userId)
  if (!target) throw userError("Usuário não encontrado")

  assertCanManageUser(requester, target)

  const sanitized = sanitizeUserPayload(requester, newUserStructure)

  const updated = await User.updateOne(
    { _id: userId},
    { $set: sanitized}
  )
  return updated
}

/**
 * Verifica se a empresa do usuário tem acesso ativo ao sistema.
 * Usuários com company == 0 (super-admin) nunca são bloqueados.
 * Retorna { allowed: true } ou { allowed: false, message: string }.
 */
export async function checkCompanyAccess(companyCode) {
  // Super-admin (company == 0) bypassa todas as checagens
  if (String(companyCode) === '0') return { allowed: true }

  const company = await Company.findOne({ code: companyCode })

  // Se a empresa não existir no banco, não bloqueia (edge case de dados)
  if (!company) return { allowed: true }

  if (!company.is_active) {
    return { allowed: false, message: 'Company account is inactive. Please contact support.' }
  }

  const validStatuses = ['active', 'trialing']
  if (!validStatuses.includes(company.subscription_status)) {
    return { allowed: false, message: 'Subscription is not active. Please renew your plan to continue.' }
  }

  if (company.subscription_end && new Date(company.subscription_end) < new Date()) {
    return { allowed: false, message: 'Subscription has expired. Please contact support to renew.' }
  }

  return { allowed: true }
}
