import "server-only";
import { put } from "@vercel/blob";
import { ExternalServiceError } from "@/src/server/http/errors";
import type { StorageProvider } from "./provider";

/**
 * Vercel Blob implementation. `addRandomSuffix` produces an unguessable
 * pathname; combined with content validation this prevents enumeration and
 * malicious overwrites. (Switch to access:"private" + signed URLs if avatars
 * ever need to be non-public.)
 */
export const vercelBlobProvider: StorageProvider = {
  async upload({ key, body, contentType }) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new ExternalServiceError(
        "Image storage is not configured (BLOB_READ_WRITE_TOKEN missing)",
      );
    }
    const blob = await put(key, body, {
      access: "public",
      addRandomSuffix: true,
      contentType,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
    });
    return { url: blob.url };
  },
};
