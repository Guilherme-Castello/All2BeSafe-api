import Company from "../models/Company.js";
import { getUserById } from "./userService.js";

export async function companyListService() {
  const companyList = await Company.find()
  return companyList
}

export async function registerNewCompanyService(name, in_charge) {
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

export async function updateCompanyService(companyId, data) {
  const updated = await Company.findByIdAndUpdate(
    companyId,
    { $set: data },
    { new: true, runValidators: true }
  )
  if (!updated) throw new Error("Company not found")
  return updated
}

export async function deleteCompanyService(companyId) {
  const deleted = await Company.findByIdAndDelete(companyId)
  if (!deleted) throw new Error("Company not found")
  return deleted
}