import { computed, ref } from "vue";
import { getLastTriedApiBase, getResolvedApiBase, NETWORK_ERROR_CODE, resetResolvedApiBase } from "./api-base";
import { clearApiNetworkErrorBase, setApiNetworkErrorBase } from "./network-status";
const RETRY_DELAYS_MS = [120, 260, 520, 900];
const NETWORK_ERROR_MESSAGE = `${NETWORK_ERROR_CODE}: Cannot connect backend service. Please retry in a moment.`;

type AuthUser = {
  id: string;
  handle: string;
  displayName: string;
  avatar: string;
};

const TOKEN_KEY = "app.auth.token";
const USER_KEY = "app.auth.user";

const tokenRef = ref(localStorage.getItem(TOKEN_KEY) ?? "");
const loadUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};
const userRef = ref<AuthUser | null>(loadUser());

const persist = () => {
  if (tokenRef.value) localStorage.setItem(TOKEN_KEY, tokenRef.value);
  else localStorage.removeItem(TOKEN_KEY);

  if (userRef.value) localStorage.setItem(USER_KEY, JSON.stringify(userRef.value));
  else localStorage.removeItem(USER_KEY);
};

const requestJson = async (path: string, init: RequestInit) => {
  const base = await getResolvedApiBase();
  const res = await fetch(`${base}${path}`, init);
  clearApiNetworkErrorBase();
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) return null;
  const json = await res.json().catch(() => null);
  if (!json) return null;
  return { res, json };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const authFetch = async <T>(path: string, method: "GET" | "POST", body?: unknown, withAuth = false): Promise<T> => {
  const headers: Record<string, string> = {};
  if (method === "POST") headers["Content-Type"] = "application/json";
  if (withAuth && tokenRef.value) headers.Authorization = `Bearer ${tokenRef.value}`;
  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
    let result: { res: Response; json: any } | null = null;
    try {
      result = await requestJson(path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      resetResolvedApiBase();
      await sleep(RETRY_DELAYS_MS[attempt]);
      continue;
    }
    if (!result) {
      resetResolvedApiBase();
      await sleep(RETRY_DELAYS_MS[attempt]);
      continue;
    }
    if (!result.res.ok) throw new Error(result.json?.error?.code ?? "REQUEST_FAILED");
    return result.json.data as T;
  }
  setApiNetworkErrorBase(getLastTriedApiBase());
  throw new Error(NETWORK_ERROR_MESSAGE);
};

export const getAuthToken = () => tokenRef.value;

export const useAuth = () => {
  const register = async (params: { handle: string; displayName: string; password: string; avatar?: string }) => {
    const data = await authFetch<{ user: AuthUser; token: string }>("/auth/register", "POST", params);
    tokenRef.value = data.token;
    userRef.value = data.user;
    persist();
    return data.user;
  };

  const login = async (params: { handle: string; password: string }) => {
    const data = await authFetch<{ user: AuthUser; token: string }>("/auth/login", "POST", params);
    tokenRef.value = data.token;
    userRef.value = data.user;
    persist();
    return data.user;
  };

  const logout = async () => {
    try {
      if (tokenRef.value) {
        await authFetch("/auth/logout", "POST", {}, true);
      }
    } catch {
      // ignore logout request errors
    }
    tokenRef.value = "";
    userRef.value = null;
    persist();
  };

  const refresh = async () => {
    if (!tokenRef.value) {
      userRef.value = null;
      persist();
      return null;
    }
    try {
      const user = await authFetch<AuthUser>("/auth/me", "GET", undefined, true);
      userRef.value = user;
      persist();
      return user;
    } catch {
      tokenRef.value = "";
      userRef.value = null;
      persist();
      return null;
    }
  };

  return {
    token: computed(() => tokenRef.value),
    user: computed(() => userRef.value),
    isLoggedIn: computed(() => Boolean(tokenRef.value && userRef.value)),
    register,
    login,
    logout,
    refresh,
  };
};
