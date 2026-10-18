const KEY = "pos_auth";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
};

export type AuthState = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};

export function getAuth(): AuthState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function getToken(): string | null {
  return getAuth()?.access_token ?? null;
}

export function getUser(): AuthUser | null {
  return getAuth()?.user ?? null;
}

export function setAuth(state: AuthState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}
