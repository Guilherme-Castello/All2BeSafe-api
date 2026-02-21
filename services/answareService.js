import Answare from "../models/Answare.js";
import Template from "../models/Template.js";

export async function getAnswaredTemplateService(aId) {
  const answare = await Answare.findById(aId);
  const template = await Template.findById(answare.template_id);
  console.log("gotAnswareHere")
  console.log(answare)
  return answareTemplate(template, answare)
}

export async function getUserAnswaresService(uId) {
  const answares = await Answare.find({ user_id: uId }).select("_id template_id status name").populate("template_id", "config").lean();
  return answares
}

export async function createNewAnswareService(answare) {
  const newAnsware = new Answare({ ...answare, status: 'in_progress' })
  await getUpdatePercentage(newAnsware);

  const savedAnsware = await newAnsware.save()

  return savedAnsware
}

function getAnswareById(answares, targetId) {
  if (!answares) return
  return answares.find(a => a.question_id == targetId)
}

export async function updateAnswareService(aId, updatedAnware) {
  const answare = await Answare.findById(aId);
  if (!answare) throw new Error("Answare não encontrada");

  const existingMap = new Map(
    answare.answares.map(item => [item.question_id, item])
  );

  const mergedAnswares = updatedAnware.answares.map(newItem => {
    const oldItem = existingMap.get(newItem.question_id);

    return {
      ...oldItem?.toObject(), 
      ...newItem,             
      answare_note:
        newItem.answare_note ?? oldItem?.answare_note
    };
  });

  answare.answares = mergedAnswares;

  await getUpdatePercentage(answare);

  answare.markModified("answares");
  answare.markModified("complete_percentage");

  await answare.save();
  return answare;
}

export async function setAsDoneService(aId) {
  const answare = await Answare.updateOne({ _id: aId }, { $set: { status: "done" } })
  return answare
}

export async function defineAnswareNoteService(aId, qId, note) {
  console.log({ aId, qId, note })
  const answare = await Answare.updateOne(
    { _id: aId },
    {
      $set: {
        "answares.$[item].answare_note": note
      }
    },
    {
      arrayFilters: [{ "item.question_id": qId }]
    }
  );
  return answare
}

async function getUpdatePercentage(answare) {
  const questionTemplate = await Template.findById(answare.template_id);
  const template = answareTemplate(questionTemplate, answare);
  const sectionsList = [...new Set(template.questions.map(q => q.section))];

  const complete_percentage = [];

  for (const section of sectionsList) {
    let answeredCount = 0;
    let questionCount = 0;

    template.questions.forEach(question => {
      if (question.section !== section) return;
      questionCount++;

      const answered =
        question.value !== "" ||
        question.check_boxes.some(cb => cb.value === true);

      if (answered) answeredCount++;
    });

    complete_percentage.push({
      section_name: section,
      percentage: questionCount === 0
        ? 0
        : (answeredCount * 100) / questionCount,
    });
  }

  answare.complete_percentage = complete_percentage;
}

function answareTemplate(template, answare) {
  const questions = template.questions
  let aQuestions = questions.map(q => {
    let a = getAnswareById(answare.answares, q.id)
    if (q.kind == 'check_boxes') {
      return { ...q.toObject(), check_boxes: a.answare_checkboxes, answare_images: a.answare_images, answare_note: a.answare_note }
    } else if (q.kind == 'location') {
      return { ...q.toObject(), value: a.answare_text, coords: a.answare_coords, answare_images: a.answare_images, answare_note: a.answare_note }
    } else {
      return { ...q.toObject(), value: a.answare_text, answare_images: a.answare_images, answare_note: a.answare_note }
    }
  })
  return { ...template.toObject(), questions: aQuestions }
}