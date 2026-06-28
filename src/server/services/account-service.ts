import "server-only";
import { prisma } from "@/src/server/db";
import { ConflictError, NotFoundError } from "@/src/server/http/errors";
import {
  getUserProfile,
  withSinglePrimary,
} from "@/src/server/repositories/user-repo";
import type { UpdateAccountInput } from "@/src/server/validation/account-schemas";

/**
 * Update the signed-in user's own profile, emails, and phones.
 * Emails/phones are reconciled wholesale; email verification status is preserved
 * for addresses the user keeps. Emails owned by *another* user are rejected.
 */
export async function updateAccount(userId: string, input: UpdateAccountInput) {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!existing) throw new NotFoundError("User not found");

  const desiredAddresses = input.emails.map((e) => e.address);

  // Reject emails already registered to a different account.
  const clash = await prisma.email.findFirst({
    where: { address: { in: desiredAddresses }, userId: { not: userId } },
    select: { address: true },
  });
  if (clash) throw new ConflictError("That email address is already in use");

  // Preserve verified status for addresses the user is keeping.
  const current = await prisma.email.findMany({ where: { userId }, select: { address: true, verified: true } });
  const verifiedByAddress = new Map(current.map((e) => [e.address, e.verified]));

  const emails = withSinglePrimary(input.emails);
  const phones = withSinglePrimary(input.phones);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        // `undefined` leaves the column unchanged; `null` clears it.
        dateOfBirth: input.dateOfBirth === undefined ? undefined : input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        gender: input.gender ?? undefined,
        address: input.address ?? undefined,
        country: input.country ?? undefined,
        bio: input.bio ?? undefined,
        avatarUrl: input.avatarUrl ?? undefined,
      },
    });

    await tx.email.deleteMany({ where: { userId } });
    await tx.email.createMany({
      data: emails.map((e) => ({
        userId,
        address: e.address,
        isPrimary: e.isPrimary,
        verified: verifiedByAddress.get(e.address) ?? false,
      })),
    });

    await tx.phone.deleteMany({ where: { userId } });
    await tx.phone.createMany({
      data: phones.map((p) => ({
        userId,
        countryCode: p.countryCode,
        number: p.number,
        isPrimary: p.isPrimary,
      })),
    });
  });

  return getUserProfile(userId);
}
