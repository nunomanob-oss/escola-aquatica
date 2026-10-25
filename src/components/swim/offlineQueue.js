// Fila de escrita offline para fichas de treino (WorkoutSheet) e sumários (ClassSummary).
// Sem rede, as operações ficam guardadas no dispositivo e são enviadas quando a ligação volta.
import { entities } from "@/lib/entities";
import { isNetworkError, isOffline, readCache, writeCache } from "./offlineCache";

const QUEUE_KEY = "swim_pending_writes";
const FAILED_KEY = "swim_failed_writes";
export const SYNC_EVENT = "swim:synced";

const readQueue = () => readCache(QUEUE_KEY, []);
const writeQueue = (queue) => writeCache(QUEUE_KEY, queue);
const isLocalId = (id) => typeof id === "string" && id.startsWith("local-");
const newLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function pendingCount() {
  return readQueue().length;
}

function enqueue(entry) {
  writeQueue([...readQueue(), { ...entry, qid: newLocalId(), ts: Date.now() }]);
}

async function appendSummaryRemote({ date, level_id, exercise_id }) {
  const res = await entities.ClassSummary.filter({ date, level_id }, { limit: 1 });
  const current = (Array.isArray(res) ? res : res.items || [])[0];
  if (current) {
    const ids = new Set(current.exercise_ids || []);
    ids.add(exercise_id);
    return entities.ClassSummary.update(current.id, { exercise_ids: [...ids] });
  }
  return entities.ClassSummary.create({
    date,
    level_id,
    exercise_ids: [exercise_id],
    notes: "",
  });
}

function runEntry(entry) {
  const entity = entities[entry.entity];
  if (entry.op === "create") return entity.create(entry.data);
  if (entry.op === "update") return entity.update(entry.id, entry.data);
  if (entry.op === "delete") return entity.delete(entry.id);
  if (entry.op === "appendSummary") return appendSummaryRemote(entry.data);
  return Promise.resolve();
}

let flushing = null;

// Envia a fila por ordem. Para ao primeiro erro de rede; erros do servidor são postos de parte.
export function flushQueue() {
  if (flushing) return flushing;
  flushing = (async () => {
    let sent = 0;
    while (!isOffline()) {
      const [entry] = readQueue();
      if (!entry) break;
      try {
        await runEntry(entry);
        sent += 1;
      } catch (error) {
        // Sem rede ou sessão expirada: tenta outra vez mais tarde, sem perder a operação.
        if (isNetworkError(error) || error.status === 401 || error.status === 403) break;
        writeCache(FAILED_KEY, [...readCache(FAILED_KEY, []), { ...entry, error: error.message }]);
      }
      writeQueue(readQueue().filter((item) => item.qid !== entry.qid));
    }
    if (sent > 0) window.dispatchEvent(new Event(SYNC_EVENT));
    return sent;
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

// Tenta a rede; se não houver ligação (ou ainda houver fila por enviar), guarda na fila.
async function runOrQueue(entry, remote) {
  if (readQueue().length > 0) await flushQueue();
  if (!isOffline() && readQueue().length === 0) {
    try {
      return { record: await remote(), queued: false };
    } catch (error) {
      if (!isNetworkError(error)) throw error;
    }
  }
  enqueue(entry);
  return { record: null, queued: true };
}

// Cria ou atualiza um registo. Devolve { record, queued }.
export async function saveRecord(entityName, id, data) {
  if (isLocalId(id)) {
    // Registo ainda não enviado: atualiza a criação pendente em vez de criar outra operação.
    writeQueue(
      readQueue().map((item) =>
        item.entity === entityName && item.op === "create" && item.id === id
          ? { ...item, data: { ...item.data, ...data } }
          : item
      )
    );
    return { record: { id, ...data }, queued: true };
  }

  const entity = entities[entityName];
  if (id) {
    const result = await runOrQueue({ entity: entityName, op: "update", id, data }, () =>
      entity.update(id, data)
    );
    return { record: result.record || { id, ...data }, queued: result.queued };
  }

  const localId = newLocalId();
  const result = await runOrQueue({ entity: entityName, op: "create", id: localId, data }, () =>
    entity.create(data)
  );
  return { record: result.record || { id: localId, ...data }, queued: result.queued };
}

export async function removeRecord(entityName, id) {
  if (isLocalId(id)) {
    writeQueue(readQueue().filter((item) => !(item.entity === entityName && item.id === id)));
    return { queued: true };
  }
  const entity = entities[entityName];
  return runOrQueue({ entity: entityName, op: "delete", id }, () => entity.delete(id));
}

// Junta um exercício ao sumário da turma nessa data (cria o sumário se ainda não existir).
export function appendToSummary(data) {
  return runOrQueue({ entity: "ClassSummary", op: "appendSummary", data }, () =>
    appendSummaryRemote(data)
  );
}

// Aplica à lista vinda da rede/cache as operações que ainda estão na fila.
export function applyPending(entityName, records) {
  let result = [...records];
  readQueue()
    .filter((item) => item.entity === entityName)
    .forEach((item) => {
      if (item.op === "create") result = [...result, { id: item.id, ...item.data }];
      if (item.op === "update")
        result = result.map((r) => (r.id === item.id ? { ...r, ...item.data } : r));
      if (item.op === "delete") result = result.filter((r) => r.id !== item.id);
    });
  return result;
}
