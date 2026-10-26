// Cache local (localStorage) para a app funcionar no piso da piscina sem rede.

export const CACHE_KEYS = {
  levels: "swim_cache_levels",
  exercises: "swim_cache_exercises",
  contents: "swim_cache_contents",
  sheets: "swim_cache_sheets",
  summaries: "swim_cache_summaries",
  publicSettings: "swim_cache_public_settings",
  user: "swim_cache_user",
};

export function readCache(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sem espaço ou armazenamento bloqueado: a app continua só com a rede.
  }
}

export function removeCache(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignorar
  }
}

// Erros de rede: sem `status`, ou status 0 (pedido não chegou ao servidor).
export function isNetworkError(error) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  return !error || error.status === undefined || error.status === null || error.status === 0;
}

export function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

// Lê todas as páginas de uma entidade (cursor), para guardar a lista completa em cache.
export async function fetchAll(entity, query = {}, sort) {
  const items = [];
  let cursor = null;
  do {
    const options = cursor ? { cursor, limit: 500 } : { limit: 500, ...(sort ? { sort } : {}) };
    const res = await entity.filter(query, options);
    const page = Array.isArray(res) ? res : res.items || [];
    items.push(...page);
    cursor = Array.isArray(res) ? null : res.next_cursor || null;
  } while (cursor);
  return items;
}

// Rede primeiro; se o pedido falhar, devolve a última cópia guardada (se existir).
export async function loadWithCache(key, loader) {
  try {
    const data = await loader();
    writeCache(key, data);
    return data;
  } catch (error) {
    const cached = readCache(key, null);
    if (cached) return cached;
    throw error;
  }
}
