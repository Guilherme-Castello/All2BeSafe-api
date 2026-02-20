import Company from "../models/Company.js";

export async function companyListService() {
  const companyList = await Company.find()
  return companyList
}

export async function registerNewCompanyService(name, in_charge) {
  const lastCompany = await Company.findOne().sort({code: -1})
  const newCompany = new Company({name, in_charge, code: lastCompany.code+1}).save()
  return newCompany
}