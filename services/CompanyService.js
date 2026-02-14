export async function companyListService() {
  const companyList = await Company.find()
  return companyList
}