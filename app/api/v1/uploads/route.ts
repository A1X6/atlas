import type { NextRequest } from "next/server";
import { handle, created } from "@/src/server/http/respond";
import { ValidationError } from "@/src/server/http/errors";
import { uploadImage, type UploadKind } from "@/src/server/services/upload-service";
import { MAX_IMAGE_BYTES } from "@/src/server/storage/image-validation";
import { enforceRateLimit, clientIp } from "@/src/server/security/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/v1/uploads — image upload (multipart form-data, field "file").
 * Optional "kind" field ("avatar" | "product") folders the file accordingly;
 * defaults to "avatar" for backward compatibility. Intentionally usable pre-auth
 * so it can power the registration form, but hardened: strict content validation
 * (magic bytes), size cap, random storage keys, and IP rate limiting. Returns
 * only an opaque URL.
 */
export const POST = handle(async (req: NextRequest) => {
  await enforceRateLimit("upload", clientIp(req), 10, "10 m");

  const form = await req.formData().catch(() => {
    throw new ValidationError("Expected multipart form-data");
  });
  const file = form.get("file");
  if (!(file instanceof File)) throw new ValidationError("Missing 'file' field");
  if (file.size > MAX_IMAGE_BYTES) throw new ValidationError("Image exceeds the 4 MB limit");

  const kind: UploadKind = form.get("kind") === "product" ? "product" : "avatar";
  const buf = Buffer.from(await file.arrayBuffer());
  const { url } = await uploadImage(buf, kind);
  return created({ url });
});
