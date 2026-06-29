import "server-only";
import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/src/server/db";

export type CreateUserData = {
  firstName: string;
  lastName: string;
  passwordHash: string;
  role?: Role;
  dateOfBirth?: Date | null;
  gender?: string | null;
  address?: string | null;
  country?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  emails: { address: string; isPrimary: boolean }[];
  phones: { countryCode: string; number: string; isPrimary: boolean }[];
};

/** Canonical identity for a phone number (countryCode + number) used as a map
 *  key when preserving verified status and as the OTP token's `phone` target. */
export function phoneKey(countryCode: string, number: string): string {
  return `${countryCode.trim()}|${number.trim()}`;
}

/** Ensure exactly one entry is marked primary (default to the first). */
export function withSinglePrimary<T extends { isPrimary: boolean }>(items: T[]): T[] {
  let primarySeen = false;
  const out = items.map((it) => {
    if (it.isPrimary && !primarySeen) {
      primarySeen = true;
      return it;
    }
    return { ...it, isPrimary: false };
  });
  if (!primarySeen && out.length > 0) out[0] = { ...out[0], isPrimary: true };
  return out;
}

export async function findAnyEmail(addresses: string[]) {
  return prisma.email.findFirst({ where: { address: { in: addresses } } });
}

export async function findUserByEmailForAuth(address: string) {
  const email = await prisma.email.findUnique({
    where: { address },
    select: {
      verified: true,
      user: {
        select: {
          id: true,
          role: true,
          passwordHash: true,
          failedLoginAttempts: true,
          lockedUntil: true,
        },
      },
    },
  });
  if (!email) return null;
  // Surface the verification status of the *specific* email used to sign in.
  return { ...email.user, emailVerified: email.verified };
}

/** Persist lockout counters after a failed/successful login. */
export function setLoginState(
  userId: string,
  state: { failedLoginAttempts: number; lockedUntil: Date | null },
) {
  return prisma.user.update({ where: { id: userId }, data: state });
}

export async function createUser(data: CreateUserData) {
  const emails = withSinglePrimary(data.emails);
  const phones = withSinglePrimary(data.phones);

  return prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      passwordHash: data.passwordHash,
      role: data.role ?? "USER",
      dateOfBirth: data.dateOfBirth ?? null,
      gender: data.gender ?? null,
      address: data.address ?? null,
      country: data.country ?? null,
      bio: data.bio ?? null,
      avatarUrl: data.avatarUrl ?? null,
      emails: { create: emails },
      phones: { create: phones },
    },
    select: profileSelect,
  });
}

export const profileSelect = {
  id: true,
  firstName: true,
  lastName: true,
  role: true,
  dateOfBirth: true,
  gender: true,
  address: true,
  country: true,
  bio: true,
  avatarUrl: true,
  createdAt: true,
  emails: { select: { id: true, address: true, isPrimary: true, verified: true } },
  phones: { select: { id: true, countryCode: true, number: true, isPrimary: true, verified: true } },
} satisfies Prisma.UserSelect;

export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: profileSelect });
}

export async function listUsers(args: { skip: number; take: number; q?: string }) {
  const where: Prisma.UserWhereInput = args.q
    ? {
        OR: [
          { firstName: { contains: args.q, mode: "insensitive" } },
          { lastName: { contains: args.q, mode: "insensitive" } },
          { emails: { some: { address: { contains: args.q, mode: "insensitive" } } } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: profileSelect,
      orderBy: { createdAt: "desc" },
      skip: args.skip,
      take: args.take,
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total };
}

export function countAdmins() {
  return prisma.user.count({ where: { role: "ADMIN" } });
}

export function adminUpdateUser(
  id: string,
  data: {
    role?: Role;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date | null;
    gender?: string | null;
    address?: string | null;
    country?: string | null;
    bio?: string | null;
  },
) {
  return prisma.user.update({ where: { id }, data, select: profileSelect });
}

export function getUserEmails(userId: string) {
  return prisma.email.findMany({ where: { userId }, orderBy: { isPrimary: "desc" } });
}

export function markEmailVerified(address: string) {
  return prisma.email.updateMany({ where: { address }, data: { verified: true } });
}

export function updateUserPassword(userId: string, passwordHash: string) {
  return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

// ── Refresh token persistence (hashed) ───────────────────────────────────────
export async function storeRefreshToken(input: {
  userId: string;
  jti: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ip?: string | null;
}) {
  return prisma.refreshToken.create({ data: input });
}

export async function findRefreshTokenByJti(jti: string) {
  return prisma.refreshToken.findUnique({ where: { jti } });
}

export async function revokeRefreshToken(jti: string) {
  return prisma.refreshToken.updateMany({ where: { jti }, data: { revoked: true } });
}

export async function revokeAllUserRefreshTokens(userId: string) {
  return prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });
}
