import "server-only";

/**
 * Gera um CSV simples (separador vírgula, aspas escapadas). Sem
 * dependência externa — o volume de linhas aqui (relatórios de uma
 * empresa) não justifica uma lib.
 */
function escapeCsvField(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(escapeCsvField).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsvField).join(","));
  }
  // BOM UTF-8 para o Excel reconhecer acentuação corretamente.
  return "﻿" + lines.join("\r\n") + "\r\n";
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
