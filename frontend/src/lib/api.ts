import { getAuth, setAuth, clearAuth } from "./auth";
import { getMockData } from "./mock";

const BASE = typeof window !== "undefined" && window.location.hostname === "localhost" ? "http://localhost:8000" : "/api";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method || "GET";
  const isDemo = typeof window !== "undefined" && localStorage.getItem("demo_mode") === "true";

  if (isDemo) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const mock = getMockData<T>(path, method);
    if (mock !== undefined) return mock;
    return {} as T;
  }

  const auth = getAuth();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) || {}),
  };
  
  if (auth?.access_token) {
    headers["Authorization"] = `Bearer ${auth.access_token}`;
  }

  let res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401 && auth?.refresh_token) {
    try {
      const refreshRes = await fetch(`${BASE}/auth/refresh?refresh_token=${auth.refresh_token}`, { method: "POST" });
      if (refreshRes.ok) {
        const newTokens = await refreshRes.json();
        setAuth({ access_token: newTokens.access_token, refresh_token: newTokens.refresh_token, user: newTokens.user });
        headers["Authorization"] = `Bearer ${newTokens.access_token}`;
        res = await fetch(`${BASE}${path}`, { ...init, headers });
      } else {
        clearAuth();
        if (typeof window !== "undefined") window.location.href = "/login";
        throw new Error("Session expired");
      }
    } catch {
      clearAuth();
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function login(username: string, password: string) {
  const isDemo = username === "admin" && password === "Demo123!";
  
  if (isDemo) {
    localStorage.setItem("demo_mode", "true");
    return {
      access_token: "mock_token",
      refresh_token: "mock_refresh",
      user: { id: "u1", username: "admin", email: "admin@meridian.local", role: "admin", first_name: "System", last_name: "Admin" }
    };
  }

  localStorage.removeItem("demo_mode");
  const body = new URLSearchParams({ username, password }).toString();
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("Invalid username or password");
  return res.json();
}
