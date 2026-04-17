import Answare from "../models/Answare.js";
import Template from "../models/Template.js";

export async function getAnswaredTemplateService(aId) {
  const answare = await Answare.findById(aId);
  if (!answare) throw new Error("Answare não encontrada");

  const questions = answare.answares.map(item => {
    const i = typeof item.toObject === 'function' ? item.toObject() : item;
    return {
      id:              i.question_id,
      title:           i.question_title,
      kind:            i.question_kind,
      section:         i.question_section,
      options:         i.question_options ?? [],
      value:           i.answare_text ?? '',
      check_boxes:     i.answare_checkboxes ?? [],
      coords:          i.answare_coords ?? null,
      answare_images:  i.answare_images ?? [],
      answare_note:    i.answare_note ?? ''
    };
  });

  return {
    config:              answare.template_config,
    questions,
    status:              answare.status,
    complete_percentage: answare.complete_percentage
  };
}

export async function getUserAnswaresService(uId) {
  return await Answare.find({ user_id: uId })
    .select("_id template_id status name template_config")
    .lean();
}

export async function createNewAnswareService(data) {
  const template = await Template.findById(data.template_id);
  if (!template) throw new Error("Template não encontrado");

  const prePopulatedAnswares = template.questions.map(q => ({
    question_id:      q.id,
    question_title:   q.title,
    question_kind:    q.kind,
    question_section: q.section ?? '',
    question_options: q.options ?? [],
    answare_text:     '',
    answare_checkboxes: q.check_boxes.map(cb => ({
      label: cb.label,
      value: false,
      id:    cb.id
    })),
    answare_images: [],
    answare_note:   ''
  }));

  const newAnsware = new Answare({
    template_id:     data.template_id,
    template_config: template.config.toObject(),
    user_id:         data.user_id,
    name:            data.name,
    status:          'in_progress',
    answares:        prePopulatedAnswares
  });

  await getUpdatePercentage(newAnsware);
  return await newAnsware.save();
}

function getAnswareById(answares, targetId) {
  if (!answares) return;
  return answares.find(a => a.question_id == targetId);
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
      answare_note: newItem.answare_note ?? oldItem?.answare_note
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
  return await Answare.updateOne({ _id: aId }, { $set: { status: "done" } });
}

export async function defineAnswareNoteService(aId, qId, note) {
  console.log({ aId, qId, note });
  return await Answare.updateOne(
    { _id: aId },
    { $set: { "answares.$[item].answare_note": note } },
    { arrayFilters: [{ "item.question_id": qId }] }
  );
}

async function getUpdatePercentage(answare) {
  const sectionsList = [...new Set(answare.answares.map(item => item.question_section))];

  const complete_percentage = [];

  for (const section of sectionsList) {
    let answeredCount = 0;
    let questionCount = 0;

    answare.answares.forEach(item => {
      if (item.question_section !== section) return;
      questionCount++;

      const i = typeof item.toObject === 'function' ? item.toObject() : item;
      const answered =
        (i.answare_text && i.answare_text !== '') ||
        (i.answare_checkboxes && i.answare_checkboxes.some(cb => cb.value === true));

      if (answered) answeredCount++;
    });

    complete_percentage.push({
      section_name: section,
      percentage: questionCount === 0
        ? 0
        : (answeredCount * 100) / questionCount
    });
  }

  answare.complete_percentage = complete_percentage;
}
