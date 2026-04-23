import { companyListService, deleteCompanyService, registerNewCompanyService, updateCompanyService } from "../services/CompanyService.js";
import { getUserById } from "../services/userService.js";
import { handleError, handleSuccess } from "../utils/httpResponse.js";

// Campos que controlam a licença — só access_level=3 ou company=0 pode alterar
const LICENSE_FIELDS = ['plan_name', 'plan_seats', 'subscription_status', 'subscription_end', 'is_active', 'notes']

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

export async function updateCompanyController(req, res) {
  try {
    const { companyId, updatedCompany, requestingUserId } = req.body

    // Verifica se o payload tenta alterar campos de licença
    const hasLicenseFields = LICENSE_FIELDS.some(f => f in (updatedCompany ?? {}))

    if (hasLicenseFields) {
      if (!requestingUserId) {
        return handleError("Unauthorized: authentication required to update license fields", res, 200)
      }

      const requester = await getUserById(requestingUserId)
      if (!requester) {
        return handleError("Unauthorized: requesting user not found", res, 200)
      }

      const isAdmin = String(requester.access_level) === '3' || String(requester.company) === '0'
      if (!isAdmin) {
        return handleError("Unauthorized: only administrators can update license fields", res, 200)
      }
    }

    const updated = await updateCompanyService(companyId, updatedCompany)
    handleSuccess(updated, res)
  } catch (e) {
    handleError(e.message, res)
  }
}

export async function deleteCompanyController(req, res) {
  try {
    const { companyId } = req.body
    await deleteCompanyService(companyId)
    handleSuccess({ message: "Company deleted" }, res)
  } catch (e) {
    handleError(e.message, res)
  }
}
