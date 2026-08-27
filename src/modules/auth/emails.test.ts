import { describe, expect, it } from "vitest";
import { passwordResetEmail } from "@/modules/auth/emails";

describe("passwordResetEmail", () => {
  it("includes the reset URL in both the html and text bodies", () => {
    const email = passwordResetEmail("https://afiliai.com/redefinir-senha/abc123");

    expect(email.text).toContain("https://afiliai.com/redefinir-senha/abc123");
    expect(email.html).toContain("https://afiliai.com/redefinir-senha/abc123");
  });

  it("has a non-empty subject", () => {
    const email = passwordResetEmail("https://afiliai.com/redefinir-senha/abc123");
    expect(email.subject.length).toBeGreaterThan(0);
  });

  it("escapes HTML-significant characters in the URL before embedding it in the html body", () => {
    // Um token hex nunca teria esses caracteres — é só para garantir que a
    // função não faz interpolação ingênua caso a URL algum dia carregue algo
    // fora do controle (ex.: query string).
    const email = passwordResetEmail('https://afiliai.com/x?a="><script>alert(1)</script>');

    expect(email.html).not.toContain("<script>alert(1)</script>");
  });
});
