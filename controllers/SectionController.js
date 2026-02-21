import { createSection, deleteSectionService, listSectionsService } from "../services/SectionService.js";
import { handleError, handleSuccess } from "../utils/httpResponse.js";

export async function newSectionController(req, res) {
  try {
    const { sectionName } = req.body;
    const createdSection = await createSection(sectionName)
    console.log(createdSection)
    return handleSuccess(createdSection, res)
  } catch (err) {
    if(err.message.includes("E11000")) {
      return handleError("Section already exists", res, 200)
    }
    return handleError(err.message, res)
  }
}

export async function listSectionsController(req, res) {
  try {
    const sections = await listSectionsService()
    return handleSuccess(sections, res)
  } catch (err) {
    return handleError(message, res)
  }
}

export async function deleteSectionsController(req, res) {
  try {
    const { id } = req.body
    const deletedSection = await deleteSectionService(id)
    return handleSuccess(deletedSection, res)
  } catch (err) {
    return handleError(message, res)
  }
}