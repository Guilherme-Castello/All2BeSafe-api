import Company from "../models/Company.js";
import { getUserById } from "./userService.js";
import { isSuperAdmin } from "../utils/permissions.js";
import { userError } from "../utils/errors.js";

// Cadastro/edição/exclusão de empresa é restrito ao Super Admin (empresa "0",
// nível "3") — são eles que criam as empresas clientes e seus usuários.
async function assertIsSuperAdmin(requesterId) {
  if (!requesterId) throw userError("Requisitante não informado")

  const requester = await getUserById(requesterId)
  if (!requester) throw userError("Requisitante não encontrado")

  if (!isSuperAdmin(requester)) {
    throw userError("Somente o Super Admin pode gerenciar empresas")
  }
}

export async function companyListService() {
  const companyList = await Company.find()
  return companyList
}

export async function registerNewCompanyService(requesterId, name, in_charge) {
  await assertIsSuperAdmin(requesterId)

  const lastCompany = await Company.findOne().sort({code: -1})
  const newCompany = new Company({name, in_charge, code: lastCompany.code+1}).save()
  return newCompany
}

export async function getCompanyById() {
  const companyList = await Company.find()
  return companyList
}

export async function getCompanyByUserId(user_id) {
  const user = await getUserById(user_id)
  const company = await Company.findOne({code: user.company})
  return company
}

export async function updateCompanyService(requesterId, companyId, data) {
  await assertIsSuperAdmin(requesterId)

  const updated = await Company.findByIdAndUpdate(
    companyId,
    { $set: data },
    { new: true, runValidators: true }
  )
  if (!updated) throw userError("Company not found")
  return updated
}

export async function deleteCompanyService(requesterId, companyId) {
  await assertIsSuperAdmin(requesterId)

  const deleted = await Company.findByIdAndDelete(companyId)
  if (!deleted) throw userError("Company not found")
  return deleted
}