import "server-only";
import type { StorageProvider } from "./provider";
import { vercelBlobProvider } from "./vercel-blob";

export type { StorageProvider } from "./provider";

/** Single place that selects the active storage backend. */
export function getStorage(): StorageProvider {
  return vercelBlobProvider;
}
