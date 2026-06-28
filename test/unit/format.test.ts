import { describe, it, expect } from "vitest";
import { slugify, formatPrice } from "@/src/lib/format";

describe("slugify", () => {
  it("lowercases and dashes", () => {
    expect(slugify("Aurora Headphones")).toBe("aurora-headphones");
  });
  it("strips punctuation and trims dashes", () => {
    expect(slugify("  Vertex Webcam 4K!! ")).toBe("vertex-webcam-4k");
  });
});

describe("formatPrice", () => {
  it("formats whole-dollar amounts without decimals", () => {
    expect(formatPrice(24900, "USD")).toBe("$249");
  });
  it("formats fractional amounts with decimals", () => {
    expect(formatPrice(12999, "USD")).toBe("$129.99");
  });
});
