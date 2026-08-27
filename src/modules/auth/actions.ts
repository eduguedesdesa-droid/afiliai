"use server";

import { randomBytes, createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession, destroyAllSessionsForUser } from "@/lib/session";
import { setActiveContext, clearActiveContext, contextToPath, type ActiveContext } from "@/lib/active-context";
import { uniqueCompanySlug } from "@/lib/slug";
import { logger } from "@/lib/logger";
import {
  signupEmpresaSchema,
  signupAfiliadoSchema,
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "@/modules/auth/schemas";

export type AuthFormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
    }
  | undefined;

async function currentUserAgent() {
  const h = await headers();
  return h.get("user-agent");
}

async function establishSessionAndRedirect(userId: string) {
  const userAgent = await currentUserAgent();
  await createSession(userId, { userAgent });

  const roles = await prisma.userRole.findMany({
    where: { userId },
    select: { role: true, companyId: true },
  });

  const contexts: ActiveContext[] = roles.map((r) =>
    r.role === "PLATFORM_ADMIN"
      ? { type: "PLATFORM_ADMIN" }
      : r.role === "AFFILIATE"
        ? { type: "AFFILIATE" }
        : { type: "COMPANY_MEMBER", companyId: r.companyId as string }
  );

  if (contexts.length === 1) {
    await setActiveContext(contexts[0]);
    redirect(contextToPath(contexts[0]));
  }

  await clearActiveContext();
  redirect("/escolher-contexto");
}

export async function signupEmpresa(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const validated = signupEmpresaSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    companyName: formData.get("companyName"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, email, password, companyName } = validated.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { errors: { email: ["Já existe uma conta com este e-mail."] } };
  }

  const passwordHash = await hashPassword(password);
  const slug = await uniqueCompanySlug(companyName);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: { name, email, passwordHash, status: "ACTIVE" },
      select: { id: true },
    });

    const company = await tx.company.create({
      data: { name: companyName, slug },
      select: { id: true },
    });

    await tx.companyMember.create({
      data: {
        companyId: company.id,
        userId: createdUser.id,
        role: "OWNER",
        status: "ACTIVE",
        joinedAt: new Date(),
      },
    });

    await tx.userRole.create({
      data: { userId: createdUser.id, role: "COMPANY_MEMBER", companyId: company.id },
    });

    await tx.auditLog.create({
      data: {
        companyId: company.id,
        userId: createdUser.id,
        action: "SIGNUP_EMPRESA",
        entityType: "Company",
        entityId: company.id,
      },
    });

    return createdUser;
  });

  await establishSessionAndRedirect(user.id);
}

export async function signupAfiliado(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const validated = signupAfiliadoSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, email, password } = validated.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { errors: { email: ["Já existe uma conta com este e-mail."] } };
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: { name, email, passwordHash, status: "ACTIVE" },
      select: { id: true },
    });

    await tx.affiliateProfile.create({
      data: { userId: createdUser.id, displayName: name },
    });

    await tx.userRole.create({
      data: { userId: createdUser.id, role: "AFFILIATE" },
    });

    await tx.auditLog.create({
      data: { userId: createdUser.id, action: "SIGNUP_AFILIADO" },
    });

    return createdUser;
  });

  await establishSessionAndRedirect(user.id);
}

export async function login(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { email, password } = validated.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, status: true },
  });

  // Mensagem genérica de propósito: não revelar se o e-mail existe ou não.
  const invalidCredentials: AuthFormState = { message: "E-mail ou senha inválidos." };

  if (!user) return invalidCredentials;

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) return invalidCredentials;

  if (user.status !== "ACTIVE") {
    return { message: "Esta conta está suspensa. Entre em contato com o suporte." };
  }

  await prisma.auditLog.create({ data: { userId: user.id, action: "LOGIN" } });

  await establishSessionAndRedirect(user.id);
}

export async function logout() {
  await destroySession();
  await clearActiveContext();
  redirect("/login");
}

/**
 * Sempre retorna a mesma mensagem de sucesso, exista ou não o e-mail —
 * evita que a funcionalidade seja usada para descobrir e-mails cadastrados.
 */
export async function requestPasswordReset(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validated = requestPasswordResetSchema.safeParse({ email: formData.get("email") });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const genericSuccess: AuthFormState = {
    message: "Se este e-mail estiver cadastrado, enviamos um link de recuperação.",
  };

  const user = await prisma.user.findUnique({
    where: { email: validated.data.email },
    select: { id: true },
  });

  if (!user) return genericSuccess;

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  // TODO: integrar um provedor de e-mail transacional (ex.: Resend/SES) e
  // enviar o link de fato. Por enquanto, registramos no log para uso em dev.
  logger.info("Link de recuperação de senha gerado (dev only)", {
    userId: user.id,
    resetPath: `/redefinir-senha/${rawToken}`,
  });

  return genericSuccess;
}

export async function resetPassword(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const validated = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { token, password } = validated.data;
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() < Date.now()) {
    return { message: "Este link de recuperação é inválido ou expirou. Solicite um novo." };
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  // Por segurança, redefinir a senha derruba todas as sessões ativas.
  await destroyAllSessionsForUser(resetToken.userId);

  redirect("/login?senhaRedefinida=1");
}
