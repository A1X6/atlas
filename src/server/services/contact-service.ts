import "server-only";
import { prisma } from "@/src/server/db";
import type { ContactInput } from "@/src/server/validation/product-schemas";

export async function submitContactMessage(input: ContactInput): Promise<void> {
  await prisma.contactMessage.create({
    data: { name: input.name, email: input.email, message: input.message },
  });
}
