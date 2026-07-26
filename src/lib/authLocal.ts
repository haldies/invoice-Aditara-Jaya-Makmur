import crypto from "node:crypto";
import { prisma } from "./prisma";

const SESSION_COOKIE = "lokerhub_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const PASSWORD_ITERATIONS = 120_000;

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, 32, "sha256").toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, expectedHash: string) {
  const { hash } = hashPassword(password, salt);
  const hashBuffer = Buffer.from(hash, "hex");
  const expectedHashBuffer = Buffer.from(expectedHash, "hex");
  if (hashBuffer.length !== expectedHashBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(hashBuffer, expectedHashBuffer);
}

export function hashSessionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createSessionCookieValue() {
  return crypto.randomUUID() + "." + crypto.randomBytes(32).toString("hex");
}

export async function createAppSession(userId: string) {
  const token = createSessionCookieValue();
  const tokenHash = hashSessionToken(token);
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + SESSION_TTL_MS);
  await prisma.appSession.create({
    data: {
      id: crypto.randomUUID(),
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      created_at: createdAt.toISOString(),
    },
  });
  return { token, expiresAt };
}

export async function getUserFromSessionToken(token: string) {
  const tokenHash = hashSessionToken(token);
  const session = await prisma.appSession.findUnique({
    where: { token_hash: tokenHash },
    include: { user: true },
  });
  if (!session) return null;
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await prisma.appSession.delete({ where: { token_hash: tokenHash } }).catch(() => {});
    return null;
  }
  return session.user;
}

export async function deleteSessionToken(token: string) {
  await prisma.appSession.deleteMany({ where: { token_hash: hashSessionToken(token) } });
}
