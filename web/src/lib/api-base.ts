const trimSlash = (value: string) => value.replace(/\/+$/, "");

const unique = (values: string[]) => [...new Set(values.filter(Boolean).map(trimSlash))];

const detectApiBases = () => {
  const envBase = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();
  if (envBase) return unique([envBase]);
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (window.location.port === "5173") {
      return unique([`${window.location.origin}/api/v1`]);
    }
    return unique([
      `${window.location.origin}/api/v1`,
      `${window.location.protocol}//${host}:4000/api/v1`,
      `http://${host}:4000/api/v1`,
      `https://${host}:4000/api/v1`,
      "http://localhost:4000/api/v1",
    ]);
  }
  return ["http://localhost:4000/api/v1"];
};

export const API_BASES = detectApiBases();
export const API_BASE = API_BASES[0];
export const NETWORK_ERROR_CODE = "NETWORK_ERROR";
let lastTriedApiBase = "";

let resolvedApiBase: string | null = null;
let resolvingPromise: Promise<string> | null = null;

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("TIMEOUT")), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const toHealthUrl = (apiBase: string) => {
  const raw = trimSlash(apiBase);
  if (raw.endsWith("/api/v1")) return `${raw.slice(0, -"/api/v1".length)}/health`;
  return `${raw}/health`;
};

const isHealthy = async (apiBase: string) => {
  lastTriedApiBase = apiBase;
  try {
    const res = await withTimeout(fetch(toHealthUrl(apiBase)), 1800);
    if (!res.ok) return false;
    const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
    if (!contentType.includes("application/json")) return false;
    const json = (await res.json().catch(() => null)) as { ok?: unknown } | null;
    return Boolean(json?.ok === true);
  } catch {
    return false;
  }
};

export const getLastTriedApiBase = () => lastTriedApiBase;

export const resetResolvedApiBase = () => {
  resolvedApiBase = null;
};

export const getResolvedApiBase = async () => {
  if (resolvedApiBase) return resolvedApiBase;
  if (!resolvingPromise) {
    resolvingPromise = (async () => {
      for (const candidate of API_BASES) {
        if (await isHealthy(candidate)) {
          resolvedApiBase = candidate;
          return candidate;
        }
      }
      throw new Error(NETWORK_ERROR_CODE);
    })().finally(() => {
      resolvingPromise = null;
    });
  }
  return resolvingPromise;
};
