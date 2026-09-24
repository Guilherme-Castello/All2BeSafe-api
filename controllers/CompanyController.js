import { companyListService, deleteCompanyService, registerNewCompanyService, updateCompanyService } from "../services/CompanyService.js";
import { handleError, handleSuccess } from "../utils/httpResponse.js";

export async function companyListController(req, res) {
  try {
    const companyList = await companyListService()
    handleSuccess(companyList, res)
  } catch (e) {
    handleError(e.message, res)
  }
}

export async function companyRegisterController(req, res) {
  try {
    const { name, in_charge, requester_id } = req.body

    const companyList = await registerNewCompanyService(requester_id, name, in_charge)
    handleSuccess(companyList, res)
  } catch (e) {
    if(e.message.includes("E11000")) {
      return handleError("Company already exists", res, 200)
    }
    handleError(e.message, res, e.isUserError ? 200 : 500)
  }
}

export async function updateCompanyController(req, res) {
  try {
    const { companyId, updatedCompany, requester_id } = req.body

    const updated = await updateCompanyService(requester_id, companyId, updatedCompany)
    handleSuccess(updated, res)
  } catch (e) {
    handleError(e.message, res, e.isUserError ? 200 : 500)
  }
}

export async function deleteCompanyController(req, res) {
  try {
    const { companyId, requester_id } = req.body
    await deleteCompanyService(requester_id, companyId)
    handleSuccess({ message: "Company deleted" }, res)
  } catch (e) {
    handleError(e.message, res, e.isUserError ? 200 : 500)
  }
}
