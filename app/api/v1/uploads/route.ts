import type { NextRequest } from "next/server";
import { handle, created } from "@/src/server/http/respond";
import { ValidationError } from "@/src/server/http/errors";
import { uploadAvatar } from "@/src/server/services/upload-service";
import { MAX_IMAGE_BYTES } from "@/src/server/storage/image-validation";
import { enforceRateLimit, clientIp } from "@/src/server/security/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/v1/uploads — profile image upload (multipart form-data, field "file").
 * Intentionally usable pre-auth so it can power the registration form, but
 * hardened: strict content validation (magic bytes), size cap, random storage
 * keys, and IP rate limiting. Returns only an opaque URL.
 */
export const POST = handle(async (req: NextRequest) => {
  await enforceRateLimit("upload", clientIp(req), 10, "10 m");

  const form = await req.formData().catch(() => {
    throw new ValidationError("Expected multipart form-data");
  });
  const file = form.get("file");
  if (!(file instanceof File)) throw new ValidationError("Missing 'file' field");
  if (file.size > MAX_IMAGE_BYTES) throw new ValidationError("Image exceeds the 4 MB limit");

  const buf = Buffer.from(await file.arrayBuffer());
  const { url } = await uploadAvatar(buf);
  return created({ url });
});
