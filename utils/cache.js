/**
 * Cache in-memory com TTL para dados de baixa rotatividade.
 * Uso: sections (TTL 10 min) e listas de templates (TTL 2 min).
 *
 * Não usa Redis — adequado para instância única no Render.
 * Se escalar para múltiplas instâncias, substituir por Redis.
 */

const store = new Map();

/**
 * Lê um valor do cache. Retorna null se ausente ou expirado.
 * @param {string} key
 * @returns {any|null}
 */
export function getCache(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * Grava um valor no cache com TTL.
 * @param {string} key
 * @param {any} value
 * @param {number} ttlMs  Tempo de vida em milissegundos
 */
export function setCache(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Remove todas as entradas cujo key começa com o prefixo informado.
 * Usado para invalidar grupos (ex.: 'templates:' invalida todas as páginas).
 * @param {string} prefix
 */
export function invalidateCache(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

// TTLs padrão exportados para uso nos services
export const TTL = {
  SECTIONS:  10 * 60 * 1000,  // 10 minutos
  TEMPLATES:  2 * 60 * 1000,  //  2 minutos
};
