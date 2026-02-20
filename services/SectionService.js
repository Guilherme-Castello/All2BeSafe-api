import Section from "../models/Section.js";

export async function createSection(name) {
  const createdSection = await new Section({name}).save()
  return createdSection
}

export async function listSectionsService() {
  const sections = await Section.find()
  return sections
}

export async function deleteSectionService(id) {
  const deletedSection = await Section.deleteOne({_id: id})
  return deletedSection
}