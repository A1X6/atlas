import "server-only";
import { randomUUID } from "node:crypto";
import { getStorage } from "@/src/server/storage";
import { validateImage } from "@/src/server/storage/image-validation";

/** What an uploaded image is for — determines its storage folder. */
export type UploadKind = "avatar" | "product";

const KIND_PREFIX: Record<UploadKind, string> = {
  avatar: "avatars",
  product: "products",
};

/**
 * Validate an uploaded image by its real bytes, then store it under a random,
 * unguessable key, foldered by kind (avatars/ vs products/). Returns the public URL.
 */
export async function uploadImage(buf: Buffer, kind: UploadKind): Promise<{ url: string }> {
  const { ext, mime } = validateImage(buf);
  const key = `${KIND_PREFIX[kind]}/${randomUUID()}.${ext}`;
  return getStorage().upload({ key, body: buf, contentType: mime });
}
