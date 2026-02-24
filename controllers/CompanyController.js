import { companyListService, registerNewCompanyService } from "../services/CompanyService.js";
import { handleError, handleSuccess } from "../utils/httpResponse.js";

export async function companyListController(req, res) {
  try {
    const companyList = await companyListService()
    handleSuccess(companyList, res)
  } catch (e) {
    handleError(e)
  }
}

export async function companyRegisterController(req, res) {
  try {
    const { name, in_charge } = req.body

    const companyList = await registerNewCompanyService(name, in_charge)
    handleSuccess(companyList, res)
  } catch (e) {
    if(e.message.includes("E11000")) {
      return handleError("Company already exists", res, 200)
    }
    handleError(e, res)
  }
}