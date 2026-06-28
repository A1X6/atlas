import "server-only";
import { ValidationError } from "@/src/server/http/errors";

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB

type DetectedImage = { ext: "jpg" | "png" | "webp" | "gif"; mime: string };

/**
 * Detect the real image type from the file's magic bytes — never trust the
 * client-provided Content-Type or filename (which are trivially spoofed).
 */
export function detectImageType(buf: Buffer): DetectedImage | null {
  if (buf.length < 12) return null;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return { ext: "png", mime: "image/png" };
  }
  // GIF: 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) {
    return { ext: "gif", mime: "image/gif" };
  }
  // WEBP: 'RIFF' .... 'WEBP'
  if (
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}

/** Validate size + true content type, returning the verified type. Throws on failure. */
export function validateImage(buf: Buffer): DetectedImage {
  if (buf.length === 0) throw new ValidationError("Empty file");
  if (buf.length > MAX_IMAGE_BYTES) {
    throw new ValidationError("Image exceeds the 4 MB limit");
  }
  const detected = detectImageType(buf);
  if (!detected) {
    throw new ValidationError("Unsupported file. Upload a JPG, PNG, WEBP, or GIF image.");
  }
  return detected;
}
