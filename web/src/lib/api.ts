import { getLastTriedApiBase, getResolvedApiBase, NETWORK_ERROR_CODE, resetResolvedApiBase } from "./api-base";
import { clearApiNetworkErrorBase, setApiNetworkErrorBase } from "./network-status";
const TOKEN_KEY = "app.auth.token";
const RETRY_DELAYS_MS = [120, 260, 520, 900];
const NETWORK_ERROR_MESSAGE = `${NETWORK_ERROR_CODE}: Cannot connect backend service. Please retry in a moment.`;

const buildHeaders = (json = false) => {
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const requestJson = async (path: string, init?: RequestInit) => {
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

export async function apiGet<T>(path: string): Promise<T> {
  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
    let result: { res: Response; json: any } | null = null;
    try {
      result = await requestJson(path, { headers: buildHeaders(false) });
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
    if (!result.res.ok) throw new Error(result.json?.error?.code ?? `GET ${path} failed`);
    return result.json.data as T;
  }
  setApiNetworkErrorBase(getLastTriedApiBase());
  throw new Error(NETWORK_ERROR_MESSAGE);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
    let result: { res: Response; json: any } | null = null;
    try {
      result = await requestJson(path, {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(body),
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
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
    let result: { res: Response; json: any } | null = null;
    try {
      result = await requestJson(path, {
        method: "PATCH",
        headers: buildHeaders(true),
        body: JSON.stringify(body),
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
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
    let result: { res: Response; json: any } | null = null;
    try {
      result = await requestJson(path, {
        method: "PUT",
        headers: buildHeaders(true),
        body: JSON.stringify(body),
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
}
