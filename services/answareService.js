import Answare from "../models/Answare.js";
import Formulario from "../models/Formulario.js";

export async function getAnswaredFormService(aId) {
  const answare = await Answare.findById(aId);
  const form = await Formulario.findById(answare.form_id);

  return answareForm(form, answare)
}

export async function getUserAnswaresService(uId){
  const answares = await Answare.find({ user_id: uId }).select("_id form_id status name").populate("form_id", "config").lean();
  return answares
}

function answareForm(form, answare) {
  const questions = form.questions

  let aQuestions = questions.map(q => {
    let a = getAnswareById(answare.answares, q.id)

    if (q.kind == 'check_boxes') {
      return { ...q.toObject(), check_boxes: a.answare_checkboxes }
    } else if (q.kind == 'location') {
      return { ...q.toObject(), value: a.answare_text, coords: a.answare_coords }
    } else {
      return { ...q.toObject(), value: a.answare_text }
    }
  })

  return { ...form.toObject(), questions: aQuestions }
}

function getAnswareById(answares, targetId) {
  return answares.find(a => a.question_id == targetId)
}
