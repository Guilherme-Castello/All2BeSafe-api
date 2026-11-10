import Section from "../models/Section.js";
import { getCache, setCache, invalidateCache, TTL } from "../utils/cache.js";

const CACHE_KEY = 'sections:list';

export async function createSection(name) {
  const createdSection = await new Section({name}).save()
  // Sections raramente mudam — invalida o cache ao criar
  invalidateCache(CACHE_KEY)
  return createdSection
}

export async function listSectionsService() {
  const cached = getCache(CACHE_KEY);
  if (cached) return cached;

  const sections = await Section.find()
  setCache(CACHE_KEY, sections, TTL.SECTIONS)
  return sections
}

export async function deleteSectionService(id) {
  const deletedSection = await Section.deleteOne({_id: id})
  // Invalida o cache ao deletar
  invalidateCache(CACHE_KEY)
  return deletedSection
}
