import { describe, it, expect } from "vitest";
import { getEnv } from "@/src/server/env";

/**
 * Required vars are provided by test/setup.ts. Here we assert the contract that
 * empty-string env vars are treated as unset, so optional/default fields apply
 * instead of failing validation (e.g. a local `.env` with UPSTASH_REDIS_REST_URL="").
 */
describe("getEnv", () => {
  it("treats empty-string optional vars as unset (no throw, falls back to undefined/default)", () => {
    process.env.UPSTASH_REDIS_REST_URL = "";
    process.env.UPSTASH_REDIS_REST_TOKEN = "";
    process.env.BLOB_READ_WRITE_TOKEN = "";
    process.env.EXTERNAL_API_BASE_URL = ""; // has a default → should apply

    const env = getEnv();

    expect(env.UPSTASH_REDIS_REST_URL).toBeUndefined();
    expect(env.UPSTASH_REDIS_REST_TOKEN).toBeUndefined();
    expect(env.BLOB_READ_WRITE_TOKEN).toBeUndefined();
    expect(env.EXTERNAL_API_BASE_URL).toBe("https://dummyjson.com");
  });
});
