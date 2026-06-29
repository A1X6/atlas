"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, setAccessToken, tryRefresh } from "@/src/lib/api";
import type { UserProfile } from "@/src/lib/types";
import type { RegisterInput, LoginInput } from "@/src/server/validation/auth-schemas";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  user: UserProfile | null;
  status: AuthStatus;
  login: (input: LoginInput) => Promise<UserProfile>;
  register: (input: RegisterInput) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  // Seeded by the server from the identity cookie so the nav renders the correct
  // state on first paint (no flash / lag). The bootstrap below still runs to mint
  // an in-memory access token and confirm the session; if it fails (e.g. expired)
  // the optimistic state self-heals to anonymous.
  initialUser?: UserProfile | null;
}) {
  const [user, setUser] = useState<UserProfile | null>(initialUser);
  const [status, setStatus] = useState<AuthStatus>(initialUser ? "authenticated" : "loading");

  // Bootstrap: if a refresh cookie exists, mint an access token and load the user.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const ok = await tryRefresh();
        if (!ok) {
          if (active) setStatus("anonymous");
          return;
        }
        const { user: me } = await api<{ user: UserProfile }>("/auth/me");
        if (active) {
          setUser(me);
          setStatus("authenticated");
        }
      } catch {
        if (active) setStatus("anonymous");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const { user: me, accessToken } = await api<{ user: UserProfile; accessToken: string }>(
      "/auth/login",
      { method: "POST", body: input, auth: false },
    );
    setAccessToken(accessToken);
    setUser(me);
    setStatus("authenticated");
    return me;
  }, []);

  // Registration does NOT start a session — the account must verify its email
  // before it can sign in. Returns the created (unverified) profile.
  const register = useCallback(async (input: RegisterInput) => {
    const { user: me } = await api<{ user: UserProfile }>("/auth/register", {
      method: "POST",
      body: input,
      auth: false,
    });
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST", auth: false });
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  const refresh = useCallback(async () => {
    const { user: me } = await api<{ user: UserProfile }>("/auth/me");
    setUser(me);
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
