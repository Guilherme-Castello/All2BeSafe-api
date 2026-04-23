import Answare from "../models/Answare.js";
import Template from "../models/Template.js";

export async function getAnswaredTemplateService(aId) {
  const answare = await Answare.findById(aId);
  if (!answare) throw new Error("Answare não encontrada");

  const questions = answare.answares.map(item => {
    const i = typeof item.toObject === 'function' ? item.toObject() : item;
    return {
      id:               i.question_id,
      title:            i.question_title,
      kind:             i.question_kind,
      section:          i.question_section,
      options:          i.question_options ?? [],
      required_answare: i.required_answare ?? false,
      value:            i.answare_text ?? '',
      check_boxes:      i.answare_checkboxes ?? [],
      coords:           i.answare_coords ?? null,
      answare_images:   i.answare_images ?? [],
      answare_note:     i.answare_note ?? ''
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
    question_id:       q.id,
    question_title:    q.title,
    question_kind:     q.kind,
    question_section:  q.section ?? '',
    question_options:  q.options ?? [],
    required_answare:  q.required_answare ?? false,
    answare_text:      '',
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

  // Guard: autosave pode disparar antes do form carregar no app —
  // payload vazio não deve sobrescrever as respostas existentes no banco.
  if (!updatedAnware.answares || updatedAnware.answares.length === 0) {
    return answare;
  }

  // Mapa das atualizações vindas do cliente, indexado por question_id
  const updatedMap = new Map(
    updatedAnware.answares.map(item => [String(item.question_id), item])
  );

  // Itera sobre TODOS os itens do banco (preserva metadados e respostas não tocadas).
  // Só sobrescreve os itens que o cliente enviou.
  const mergedAnswares = answare.answares.map(existingItem => {
    const oldItemObj = existingItem.toObject();
    const newItem = updatedMap.get(String(oldItemObj.question_id));
    if (!newItem) return oldItemObj;
    return {
      ...oldItemObj,
      ...newItem,
      answare_note: newItem.answare_note ?? oldItemObj.answare_note
    };
  });

  const tempDoc = { answares: mergedAnswares };
  await getUpdatePercentage(tempDoc);

  // updateOne atômico: não usa o __v do Mongoose, elimina VersionError
  // causado por múltiplos autosaves concorrentes.
  await Answare.updateOne(
    { _id: aId },
    { $set: { answares: mergedAnswares, complete_percentage: tempDoc.complete_percentage } }
  );

  return await Answare.findById(aId);
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
