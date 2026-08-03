import { createHmac, createHash, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

const COOKIE_NAME = "roundnet_admin";
const SESSION_LENGTH_SECONDS = 60 * 60 * 12;

function hash(value: string) {
  return createHash("sha256").update(value).digest();
}

function sign(expiresAt: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return "";
  return createHmac("sha256", secret).update(expiresAt).digest("base64url");
}

export function isValidAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return timingSafeEqual(hash(password), hash(expected));
}

export function createAdminSession() {
  const expiresAt = String(Math.floor(Date.now() / 1000) + SESSION_LENGTH_SECONDS);
  return {
    name: COOKIE_NAME,
    value: `${expiresAt}.${sign(expiresAt)}`,
    options: {
      httpOnly: true,
      maxAge: SESSION_LENGTH_SECONDS,
      path: "/",
      sameSite: "strict" as const,
      secure: process.env.NODE_ENV === "production",
    },
  };
}

export async function isAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token || !process.env.ADMIN_SESSION_SECRET) return false;

  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature || Number(expiresAt) <= Date.now() / 1000) return false;

  return timingSafeEqual(hash(signature), hash(sign(expiresAt)));
}

export async function clearAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}
