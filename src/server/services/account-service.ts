import "server-only";
import { prisma } from "@/src/server/db";
import { ConflictError, NotFoundError, PhoneNotVerifiedError } from "@/src/server/http/errors";
import {
  getUserProfile,
  phoneKey,
  withSinglePrimary,
} from "@/src/server/repositories/user-repo";
import { sendEmailVerificationFor } from "@/src/server/services/auth-service";
import { requestPhoneVerification } from "@/src/server/services/phone-service";
import type { UpdateAccountInput } from "@/src/server/validation/account-schemas";

/**
 * Update the signed-in user's own profile, emails, and phones.
 *
 * Emails/phones are reconciled wholesale, but verification status is preserved
 * for entries the user keeps. New, unverified contacts are saved but kick off a
 * verification flow automatically (email link / SMS code). An unverified phone
 * may not be made primary while a verified one exists. Emails owned by *another*
 * user are rejected.
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

  // Preserve verified status for entries the user is keeping.
  const [currentEmails, currentPhones] = await Promise.all([
    prisma.email.findMany({ where: { userId }, select: { address: true, verified: true } }),
    prisma.phone.findMany({
      where: { userId },
      select: { countryCode: true, number: true, verified: true },
    }),
  ]);
  const verifiedByAddress = new Map(currentEmails.map((e) => [e.address, e.verified]));
  const verifiedByPhone = new Map(
    currentPhones.map((p) => [phoneKey(p.countryCode, p.number), p.verified]),
  );

  const emails = withSinglePrimary(input.emails);
  const phones = withSinglePrimary(input.phones).map((p) => ({
    ...p,
    verified: verifiedByPhone.get(phoneKey(p.countryCode, p.number)) ?? false,
  }));

  // The primary phone must be verified — unless the user has no verified phone
  // at all yet (bootstrap), so they're never locked out of editing their profile.
  const primaryPhone = phones.find((p) => p.isPrimary);
  const hasAnyVerifiedPhone = phones.some((p) => p.verified);
  if (primaryPhone && !primaryPhone.verified && hasAnyVerifiedPhone) {
    throw new PhoneNotVerifiedError();
  }

  // Figure out what's newly added so we can trigger verification after committing.
  const newEmailAddresses = emails
    .filter((e) => !verifiedByAddress.has(e.address))
    .map((e) => e.address);
  const newPhones = phones.filter((p) => !verifiedByPhone.has(phoneKey(p.countryCode, p.number)));

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
        verified: p.verified,
      })),
    });
  });

  // Best-effort: dispatch verification for each newly added contact. Never fail
  // the profile update if delivery (or the stub logger) throws.
  await Promise.allSettled([
    ...newEmailAddresses.map((address) => sendEmailVerificationFor(userId, address)),
    ...newPhones.map((p) => requestPhoneVerification(userId, p.countryCode, p.number)),
  ]);

  return getUserProfile(userId);
}
