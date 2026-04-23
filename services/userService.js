import User from "../models/User.js";
import Company from "../models/Company.js";
import bcrypt from "bcrypt"

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

export async function userDeleteService(userId) {
  const deleted = await User.deleteOne({_id: userId})
  return deleted
}

export async function userUpdateService(userId, newUserStructure) {
  const updated = await User.updateOne(
    { _id: userId},
    { $set: newUserStructure}
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
