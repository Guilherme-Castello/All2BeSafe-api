import { createSection, deleteSectionService, listSectionsService } from "../services/SectionService.js";
import { handleError, handleSuccess } from "../utils/httpResponse.js";

export async function newSectionController(req, res) {
  try {
    const { sectionName } = req.body;
    const createdSection = createSection(sectionName)

    return handleSuccess(createdSection, res)
  } catch (err) {
    return handleError(message, res)
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