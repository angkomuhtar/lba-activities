import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/permissions";

export interface SessionUser {
  id: string;
  username: string;
  name: string | null;
  role: Role;
}

export interface DbUser extends SessionUser {
  passwordHash: string;
  isActive: boolean;
  createdAt: Date;
}

const SESSION_COOKIE = "session";
const SESSION_SECRET = process.env.SESSION_SECRET!;
const encodedKey = new TextEncoder().encode(SESSION_SECRET);

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function encryptSession(user: SessionUser) {
  return new SignJWT({ userId: user.id, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decryptSession(
  session: string | undefined = "",
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return {
      id: payload.userId as string,
      username: (payload.username as string) || "",
      name: (payload.name as string | null) ?? null,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export async function createSession(user: SessionUser) {
  const token = await encryptSession(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decryptSession(token);
}

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}