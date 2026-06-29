import "server-only";
import {
  adminUpdateUser,
  countAdmins,
  getUserProfile,
} from "@/src/server/repositories/user-repo";
import { ForbiddenError, NotFoundError, ValidationError } from "@/src/server/http/errors";
import type { AdminUpdateUserInput } from "@/src/server/validation/user-admin-schemas";

/**
 * Admin edits another user. Guards against self-lockout: an admin cannot demote
 * their own account, and the last remaining admin cannot be demoted.
 */
export async function updateUserAsAdmin(
  adminId: string,
  targetId: string,
  input: AdminUpdateUserInput,
) {
  const target = await getUserProfile(targetId);
  if (!target) throw new NotFoundError("User not found");

  const demotingToUser = input.role === "USER" && target.role === "ADMIN";
  if (demotingToUser) {
    if (targetId === adminId) {
      throw new ForbiddenError("You cannot change your own role");
    }
    if ((await countAdmins()) <= 1) {
      throw new ValidationError("At least one admin must remain");
    }
  }

  return adminUpdateUser(targetId, {
    role: input.role,
    firstName: input.firstName,
    lastName: input.lastName,
    // `undefined` = leave unchanged; `null` = clear the field.
    dateOfBirth:
      input.dateOfBirth === undefined
        ? undefined
        : input.dateOfBirth
          ? new Date(input.dateOfBirth)
          : null,
    gender: input.gender,
    address: input.address,
    country: input.country,
    bio: input.bio,
  });
}
