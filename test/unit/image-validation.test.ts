import { describe, it, expect } from "vitest";
import { detectImageType, validateImage } from "@/src/server/storage/image-validation";

function pad(head: number[]): Buffer {
  return Buffer.concat([Buffer.from(head), Buffer.alloc(16)]);
}

describe("image magic-byte detection", () => {
  it("detects PNG", () => {
    const png = pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(detectImageType(png)?.mime).toBe("image/png");
  });

  it("detects JPEG", () => {
    expect(detectImageType(pad([0xff, 0xd8, 0xff]))?.mime).toBe("image/jpeg");
  });

  it("rejects a spoofed non-image (e.g. a script)", () => {
    const fake = Buffer.from("<script>alert(1)</script>");
    expect(detectImageType(fake)).toBeNull();
    expect(() => validateImage(fake)).toThrow();
  });

  it("rejects an oversized file", () => {
    const big = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff]),
      Buffer.alloc(5 * 1024 * 1024),
    ]);
    expect(() => validateImage(big)).toThrow(/4 MB/);
  });
});
