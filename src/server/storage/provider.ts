import "server-only";

/**
 * Storage abstraction so the rest of the app never depends on a specific
 * provider. Today it's backed by Vercel Blob; swapping to S3/Supabase later is
 * a single new implementation — business logic and routes stay unchanged.
 */
export interface StorageProvider {
  upload(input: { key: string; body: Buffer; contentType: string }): Promise<{ url: string }>;
}
