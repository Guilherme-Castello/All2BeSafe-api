import { companyListService } from "../services/CompanyService.js";
import { handleError, handleSuccess } from "../utils/httpResponse.js";

export default async function companyListController(req, res) {
  try {
    const companyList = await companyListService()
    handleSuccess(companyList, res)
  } catch (e) {
    handleError(e)
  }
}