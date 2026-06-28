"use client";

/**
 * Browser-side API client for the REST API. The access token is held only in
 * memory (never localStorage) to limit XSS exposure; the refresh token lives in
 * an httpOnly cookie. On a 401 we transparently call /auth/refresh once and retry.
 */

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type ApiOptions = Omit<RequestInit, "body"> & { body?: unknown; auth?: boolean };

async function raw(path: string, opts: ApiOptions = {}): Promise<Response> {
  const headers = new Headers(opts.headers);
  if (opts.body !== undefined && !(opts.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (opts.auth !== false && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  const body =
    opts.body instanceof FormData
      ? opts.body
      : opts.body !== undefined
        ? JSON.stringify(opts.body)
        : undefined;

  return fetch(`/api/v1${path}`, { ...opts, headers, body });
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = json?.error ?? { code: "INTERNAL_ERROR", message: "Request failed" };
    throw new ApiError(res.status, err.code, err.message, err.details);
  }
  return json?.data as T;
}

/** Try to mint a fresh access token from the refresh cookie. Returns success. */
export async function tryRefresh(): Promise<boolean> {
  const res = await fetch("/api/v1/auth/refresh", { method: "POST" });
  if (!res.ok) return false;
  const json = await res.json().catch(() => null);
  const token = json?.data?.accessToken as string | undefined;
  if (!token) return false;
  accessToken = token;
  return true;
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  let res = await raw(path, opts);
  if (res.status === 401 && opts.auth !== false) {
    const refreshed = await tryRefresh();
    if (refreshed) res = await raw(path, opts);
  }
  return parse<T>(res);
}
