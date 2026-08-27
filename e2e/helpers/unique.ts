let counter = 0;

/**
 * Sufixo curto e único por chamada (mesma ideia de src/test/fixtures.ts) —
 * evita colisão de e-mail/slug entre specs que rodam na mesma execução, sem
 * precisar truncar o banco entre um teste e outro (o servidor de E2E fica
 * de pé pra suíte inteira).
 */
function unique(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export function uniqueEmail(prefix: string): string {
  return `${unique(prefix)}@e2e.afiliai.local`;
}

export function uniqueName(prefix: string): string {
  return unique(prefix);
}
