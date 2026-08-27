"use server";

import { randomBytes, createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession, destroyAllSessionsForUser } from "@/lib/session";
import { setActiveContext, clearActiveContext, contextToPath, type ActiveContext } from "@/lib/active-context";
import { uniqueCompanySlug } from "@/lib/slug";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import {
  signupEmpresaSchema,
  signupAfiliadoSchema,
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "@/modules/auth/schemas";
import { passwordResetEmail } from "@/modules/auth/emails";

export type AuthFormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
    }
  | undefined;

const RATE_LIMITED: AuthFormState = {
  message: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
};

/**
 * Hash bcrypt fixo de uma senha arbitrária (não é a senha/hash de ninguém) —
 * usado só para gastar o mesmo tempo de CPU que uma comparação de senha
 * real quando o e-mail não existe em `login`, evitando que a diferença de
 * tempo de resposta vire um oráculo pra descobrir e-mails cadastrados.
 */
const DUMMY_PASSWORD_HASH = "$2b$12$6HtLESU0ZuRkvEM4yt8Sv.9CgeURw5hx91PhuUiWMFF.e4nCRovUi";

// Limites de rate limit (src/lib/rate-limit.ts) para os endpoints públicos
// de auth. Por IP protege contra um único atacante martelando muitas contas;
// por e-mail protege uma conta específica contra tentativas vindas de IPs
// diferentes (ex.: botnet).
const SIGNUP_IP_LIMIT = { limit: 5, windowSeconds: 60 * 60 }; // 5/hora
const LOGIN_IP_LIMIT = { limit: 10, windowSeconds: 15 * 60 }; // 10/15min
const LOGIN_EMAIL_LIMIT = { limit: 5, windowSeconds: 15 * 60 }; // 5/15min
const PASSWORD_RESET_REQUEST_IP_LIMIT = { limit: 5, windowSeconds: 60 * 60 }; // 5/hora
const PASSWORD_RESET_REQUEST_EMAIL_LIMIT = { limit: 3, windowSeconds: 60 * 60 }; // 3/hora
const PASSWORD_RESET_CONFIRM_IP_LIMIT = { limit: 10, windowSeconds: 15 * 60 }; // 10/15min

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
  const ip = await getClientIp();
  if (!checkRateLimit(`signup:ip:${ip}`, SIGNUP_IP_LIMIT).allowed) return RATE_LIMITED;

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
  const ip = await getClientIp();
  if (!checkRateLimit(`signup:ip:${ip}`, SIGNUP_IP_LIMIT).allowed) return RATE_LIMITED;

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

  const ip = await getClientIp();
  if (
    !checkRateLimit(`login:ip:${ip}`, LOGIN_IP_LIMIT).allowed ||
    !checkRateLimit(`login:email:${email}`, LOGIN_EMAIL_LIMIT).allowed
  ) {
    return RATE_LIMITED;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, status: true },
  });

  // Mensagem genérica de propósito: não revelar se o e-mail existe ou não.
  const invalidCredentials: AuthFormState = { message: "E-mail ou senha inválidos." };

  // Sempre roda a comparação bcrypt (contra um hash fixo quando o e-mail não
  // existe) para que os dois caminhos gastem tempo parecido — sem isso, a
  // diferença de tempo de resposta vira um oráculo pra descobrir e-mails
  // cadastrados mesmo com a mensagem de erro genérica.
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!user || !passwordOk) return invalidCredentials;

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

  // Checado ANTES de saber se o e-mail existe (e com o mesmo resultado nos
  // dois casos) — senão o rate limit por e-mail viraria um jeito de
  // descobrir e-mails cadastrados (só uma conta real "esgotaria" o limite).
  const ip = await getClientIp();
  if (
    !checkRateLimit(`pwreset:ip:${ip}`, PASSWORD_RESET_REQUEST_IP_LIMIT).allowed ||
    !checkRateLimit(`pwreset:email:${validated.data.email}`, PASSWORD_RESET_REQUEST_EMAIL_LIMIT).allowed
  ) {
    return RATE_LIMITED;
  }

  const genericSuccess: AuthFormState = {
    message: "Se este e-mail estiver cadastrado, enviamos um link de recuperação.",
  };

  const user = await prisma.user.findUnique({
    where: { email: validated.data.email },
    select: { id: true, email: true, name: true },
  });

  if (!user) return genericSuccess;

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const resetUrl = new URL(`/redefinir-senha/${rawToken}`, env.APP_URL).toString();
  const { subject, html, text } = passwordResetEmail(resetUrl);
  // sendEmail nunca lança e nunca muda a resposta genérica acima — se o
  // provedor falhar, o pedido continua "bem-sucedido" do ponto de vista do
  // usuário (ver comentário em src/lib/email.ts).
  await sendEmail({ to: user.email, subject, html, text });

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

  const ip = await getClientIp();
  if (!checkRateLimit(`pwreset-confirm:ip:${ip}`, PASSWORD_RESET_CONFIRM_IP_LIMIT).allowed) {
    return RATE_LIMITED;
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
