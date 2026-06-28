import "server-only";
import { randomUUID } from "node:crypto";
import { getStorage } from "@/src/server/storage";
import { validateImage } from "@/src/server/storage/image-validation";

/**
 * Validate an uploaded avatar by its real bytes, then store it under a random,
 * unguessable key. Returns the public URL.
 */
export async function uploadAvatar(buf: Buffer): Promise<{ url: string }> {
  const { ext, mime } = validateImage(buf);
  const key = `avatars/${randomUUID()}.${ext}`;
  return getStorage().upload({ key, body: buf, contentType: mime });
}
