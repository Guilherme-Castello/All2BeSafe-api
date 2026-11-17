import Action from "../models/Action.js";
import ActionActivity from "../models/ActionActivity.js";
import Answare from "../models/Answare.js";
import User from "../models/User.js";
import { isSuperAdmin } from "../utils/permissions.js";
import { userError } from "../utils/errors.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Busca o usuário que está realizando a operação.
 * Lança userError se não encontrado.
 */
async function getRequester(requester_id) {
  if (!requester_id) throw userError("requester_id is required");
  const user = await User.findById(requester_id).lean();
  if (!user) throw userError("Requester not found");
  return user;
}

/**
 * Verifica se a action pertence à empresa do requester (ou se é super admin).
 */
function assertActionCompany(action, requester) {
  if (isSuperAdmin(requester)) return;
  if (Number(action.company_code) !== Number(requester.company)) {
    throw userError("Unauthorized");
  }
}

/**
 * Cria um registro de atividade automático (não COMMENT).
 * Sempre append-only — nunca atualizar um ActionActivity existente.
 */
async function logActivity(action_id, company_code, type, createdBy, options = {}) {
  const { text = '', previous_value = '', new_value = '' } = options;
  await ActionActivity.create({
    action_id: String(action_id),
    company_code,
    type,
    text,
    previous_value,
    new_value,
    created_by: String(createdBy._id),
    created_by_name: createdBy.name,
  });
}

// ─── Services ─────────────────────────────────────────────────────────────────

/**
 * Cria uma nova Action vinculada a um AnswareItem específico.
 * Valida que o answare existe e pertence à mesma empresa do requester.
 */
export async function createActionService({
  requester_id,
  answare_id,
  question_id,
  title,
  description,
  priority,
  due_at,
  responsible_name,
}) {
  if (!answare_id) throw userError("answare_id is required");
  if (!question_id) throw userError("question_id is required");
  if (!title || !title.trim()) throw userError("title is required");

  const requester = await getRequester(requester_id);

  // Valida que o answare existe
  const answare = await Answare.findById(answare_id).lean();
  if (!answare) throw userError("Answare not found");

  // Valida que a question existe dentro do answare
  const questionExists = answare.answares.some(
    (item) => String(item.question_id) === String(question_id)
  );
  if (!questionExists) throw userError("question_id not found in this answare");

  // Multi-tenancy: verifica que o dono do answare pertence à mesma empresa
  if (!isSuperAdmin(requester)) {
    const answareOwner = await User.findById(answare.user_id).lean();
    if (!answareOwner) throw userError("Answare owner not found");
    if (Number(answareOwner.company) !== Number(requester.company)) {
      throw userError("Unauthorized");
    }
  }

  // Prazo padrão: now + 7 dias
  const defaultDueAt = new Date();
  defaultDueAt.setUTCDate(defaultDueAt.getUTCDate() + 7);

  const action = await Action.create({
    answare_id: String(answare_id),
    question_id: String(question_id),
    template_id: answare.template_id ? String(answare.template_id) : '',
    company_code: requester.company,
    created_by: String(requester._id),
    title: title.trim(),
    description: description?.trim() || '',
    priority: priority || 'LOW',
    status: 'TODO',
    due_at: due_at ? new Date(due_at) : defaultDueAt,
    responsible_name: responsible_name?.trim() || '',
  });

  // Registra evento CREATED no histórico
  await logActivity(action._id, requester.company, 'CREATED', requester);

  return action;
}

/**
 * Retorna todas as Actions não deletadas de um answare.
 */
export async function getActionsByAnswareService({ requester_id, answare_id }) {
  if (!answare_id) throw userError("answare_id is required");

  const requester = await getRequester(requester_id);

  // Valida acesso multi-tenant via answare
  if (!isSuperAdmin(requester)) {
    const answare = await Answare.findById(answare_id).select('user_id').lean();
    if (!answare) throw userError("Answare not found");
    const answareOwner = await User.findById(answare.user_id).select('company').lean();
    if (!answareOwner || Number(answareOwner.company) !== Number(requester.company)) {
      throw userError("Unauthorized");
    }
  }

  const actions = await Action.find({
    answare_id: String(answare_id),
    deleted_at: null,
  }).lean();

  return actions;
}

/**
 * Retorna os detalhes de uma Action pelo ID.
 */
export async function getActionByIdService({ requester_id, action_id }) {
  if (!action_id) throw userError("action_id is required");

  const requester = await getRequester(requester_id);
  const action = await Action.findById(action_id).lean();
  if (!action || action.deleted_at) throw userError("Action not found");

  assertActionCompany(action, requester);

  return action;
}

/**
 * Atualiza campos editáveis de uma Action.
 * Registra uma ActionActivity para cada campo que foi alterado.
 */
export async function updateActionService({
  requester_id,
  action_id,
  title,
  description,
  priority,
  due_at,
  responsible_name,
}) {
  if (!action_id) throw userError("action_id is required");

  const requester = await getRequester(requester_id);
  const action = await Action.findById(action_id);
  if (!action || action.deleted_at) throw userError("Action not found");

  assertActionCompany(action, requester);

  const updates = {};
  const activities = [];

  if (title !== undefined && title.trim() !== action.title) {
    if (!title.trim()) throw userError("title cannot be empty");
    updates.title = title.trim();
    activities.push({ type: 'UPDATED', previous_value: action.title, new_value: title.trim() });
  }

  if (description !== undefined && description.trim() !== action.description) {
    updates.description = description.trim();
    // Sem log separado para descrição — incluído no UPDATED geral
  }

  if (priority !== undefined && priority !== action.priority) {
    updates.priority = priority;
    activities.push({ type: 'PRIORITY_CHANGED', previous_value: action.priority, new_value: priority });
  }

  if (due_at !== undefined) {
    const newDueAt = new Date(due_at);
    const oldDueAt = action.due_at ? new Date(action.due_at) : null;
    if (!oldDueAt || newDueAt.getTime() !== oldDueAt.getTime()) {
      updates.due_at = newDueAt;
      activities.push({
        type: 'DUE_DATE_CHANGED',
        previous_value: oldDueAt ? oldDueAt.toISOString() : '',
        new_value: newDueAt.toISOString(),
      });
    }
  }

  if (responsible_name !== undefined && responsible_name.trim() !== action.responsible_name) {
    updates.responsible_name = responsible_name.trim();
    activities.push({
      type: 'RESPONSIBLE_CHANGED',
      previous_value: action.responsible_name,
      new_value: responsible_name.trim(),
    });
  }

  if (Object.keys(updates).length === 0) {
    return action; // Nada a alterar
  }

  Object.assign(action, updates);
  await action.save();

  // Registra cada atividade de mudança
  for (const act of activities) {
    await logActivity(action._id, action.company_code, act.type, requester, {
      previous_value: act.previous_value,
      new_value: act.new_value,
    });
  }

  return action;
}

/**
 * Atualiza o status de uma Action e registra no histórico.
 */
export async function updateActionStatusService({ requester_id, action_id, status }) {
  if (!action_id) throw userError("action_id is required");
  if (!status) throw userError("status is required");

  const validStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'UNABLE_TO_COMPLETE'];
  if (!validStatuses.includes(status)) throw userError("Invalid status value");

  const requester = await getRequester(requester_id);
  const action = await Action.findById(action_id);
  if (!action || action.deleted_at) throw userError("Action not found");

  assertActionCompany(action, requester);

  if (action.status === status) return action; // Sem mudança

  const previousStatus = action.status;
  action.status = status;
  await action.save();

  await logActivity(action._id, action.company_code, 'STATUS_CHANGED', requester, {
    previous_value: previousStatus,
    new_value: status,
  });

  return action;
}

/**
 * Soft delete de uma Action.
 * Registra evento DELETED no histórico antes de marcar como deletada.
 */
export async function deleteActionService({ requester_id, action_id }) {
  if (!action_id) throw userError("action_id is required");

  const requester = await getRequester(requester_id);
  const action = await Action.findById(action_id);
  if (!action || action.deleted_at) throw userError("Action not found");

  assertActionCompany(action, requester);

  // Registra DELETED antes do soft delete (enquanto action ainda é acessível)
  await logActivity(action._id, action.company_code, 'DELETED', requester);

  action.deleted_at = new Date();
  action.deleted_by = String(requester._id);
  await action.save();

  return { deleted: true };
}

/**
 * Retorna as atividades de uma Action em ordem cronológica.
 * Suporta paginação simples; padrão: últimas 50 atividades.
 */
export async function getActionActivitiesService({ requester_id, action_id, limit = 50, page = 1 }) {
  if (!action_id) throw userError("action_id is required");

  const requester = await getRequester(requester_id);

  // Verifica que a action existe e pertence à empresa (mesmo que deletada — histórico preservado)
  const action = await Action.findById(action_id).select('company_code deleted_at').lean();
  if (!action) throw userError("Action not found");
  assertActionCompany(action, requester);

  const skip = (page - 1) * limit;
  const [activities, total] = await Promise.all([
    ActionActivity.find({ action_id: String(action_id) })
      .sort({ created_at: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ActionActivity.countDocuments({ action_id: String(action_id) }),
  ]);

  return { activities, total, page, limit };
}

/**
 * Adiciona um comentário manual à Action.
 */
export async function addActionCommentService({ requester_id, action_id, text }) {
  if (!action_id) throw userError("action_id is required");
  if (!text || !text.trim()) throw userError("Comment text is required");

  const requester = await getRequester(requester_id);
  const action = await Action.findById(action_id).lean();
  if (!action || action.deleted_at) throw userError("Action not found");

  assertActionCompany(action, requester);

  const activity = await ActionActivity.create({
    action_id: String(action_id),
    company_code: action.company_code,
    type: 'COMMENT',
    text: text.trim(),
    previous_value: '',
    new_value: '',
    created_by: String(requester._id),
    created_by_name: requester.name,
  });

  return activity;
}
