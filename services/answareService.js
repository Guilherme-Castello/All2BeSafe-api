import Answare from "../models/Answare.js";
import Template from "../models/Template.js";

export async function getAnswaredTemplateService(aId) {
  const answare = await Answare.findById(aId);
  const template = await Template.findById(answare.template_id);

  return answareTemplate(template, answare)
}

export async function getUserAnswaresService(uId) {
  const answares = await Answare.find({ user_id: uId }).select("_id template_id status name").populate("template_id", "config").lean();
  return answares
}

export async function createNewAnswareService(answare) {
  const newAnsware = new Answare({ ...answare, status: 'in_progress' })
  const savedAnsware = await newAnsware.save()

  return savedAnsware
}

function getAnswareById(answares, targetId) {
  return answares.find(a => a.question_id == targetId)
}

export async function updateAnswareService(aId, updatedAnware) {
  const answare = await Answare.findByIdAndUpdate(
    aId,
    { answares: updatedAnware.answares }, // atualiza TODO o objeto
    { new: true }              // retorna o doc atualizado
  );
  return answare
}

function answareTemplate(template, answare) {
  const questions = template.questions

  let aQuestions = questions.map(q => {
    let a = getAnswareById(answare.answares, q.id)
    console.log(a)
    if (q.kind == 'check_boxes') {
      return { ...q.toObject(), check_boxes: a.answare_checkboxes, answare_images: a.answare_images }
    } else if (q.kind == 'location') {
      return { ...q.toObject(), value: a.answare_text, coords: a.answare_coords, answare_images: a.answare_images }
    } else {
      return { ...q.toObject(), value: a.answare_text, answare_images: a.answare_images }
    }
  })

  return { ...template.toObject(), questions: aQuestions }
}