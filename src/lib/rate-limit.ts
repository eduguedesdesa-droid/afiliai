import "server-only";

/**
 * Rate limit em memória, por processo — janela fixa por chave. Suficiente
 * para um único servidor Node (`next start`, um piloto). **NÃO** funciona
 * corretamente atrás de múltiplas instâncias/funções serverless (cada uma
 * tem sua própria memória, então o limite vira "N tentativas por
 * instância", não "N tentativas no total") — antes de um deploy assim (ex.:
 * Vercel com múltiplas regiões), trocar o armazenamento por um store
 * compartilhado (ex.: Upstash Redis), mantendo a mesma assinatura de
 * `checkRateLimit`.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Evita que o Map cresça sem limite num processo de longa duração — poda
// entradas expiradas periodicamente em vez de a cada chamada.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanupAt = 0;

function cleanupExpired(now: number) {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  /** Segundos até a janela atual resetar — só relevante quando `allowed` é `false`. */
  retryAfterSeconds: number;
};

/**
 * Verifica e já CONSOME uma tentativa para `key` (chame uma vez por
 * requisição, não antes de decidir se vale a pena checar). `limit` é o
 * número de tentativas permitidas por `windowSeconds`.
 */
export function checkRateLimit(
  key: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number }
): RateLimitResult {
  const now = Date.now();
  cleanupExpired(now);

  const windowMs = windowSeconds * 1000;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Only for tests — clears all buckets so each test starts from a clean state. */
export function __resetRateLimitForTests() {
  buckets.clear();
  lastCleanupAt = 0;
}
