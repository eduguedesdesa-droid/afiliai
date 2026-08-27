import { describe, expect, it } from "vitest";
import { toCsv, csvResponse } from "@/lib/csv";

describe("toCsv", () => {
  it("joins headers and rows with commas and CRLF", () => {
    const csv = toCsv(["nome", "total"], [["João", 500]]);
    expect(csv).toContain("nome,total\r\nJoão,500\r\n");
  });

  it("prefixes a UTF-8 BOM so Excel reads accents correctly", () => {
    const csv = toCsv(["a"], []);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("quotes and escapes fields containing commas, quotes or newlines", () => {
    const csv = toCsv(["campo"], [['ele disse "oi", tchau'], ["linha\nquebrada"]]);
    expect(csv).toContain('"ele disse ""oi"", tchau"');
    expect(csv).toContain('"linha\nquebrada"');
  });

  it("renders null/undefined as an empty field", () => {
    const csv = toCsv(["a", "b"], [[null, undefined]]);
    expect(csv).toContain("a,b\r\n,\r\n");
  });

  it("does not quote plain fields", () => {
    const csv = toCsv(["a"], [["simples"]]);
    expect(csv).not.toContain('"simples"');
  });
});

describe("csvResponse", () => {
  it("sets CSV content type and attachment disposition with the given filename", () => {
    const response = csvResponse("relatorio.csv", "a,b\r\n1,2\r\n");
    expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="relatorio.csv"');
  });
});
