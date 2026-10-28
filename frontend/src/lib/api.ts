// Production always uses same-origin paths; next.config rewrites proxy to BACKEND_ORIGIN.
// Never bake http://188... into the client (browsers block HTTPS→HTTP mixed content).
const API_URL =
  process.env.NODE_ENV === "production"
    ? "/api/v1"
    : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const UPLOAD_URL =
  process.env.NODE_ENV === "production"
    ? ""
    : process.env.NEXT_PUBLIC_UPLOAD_URL ?? "http://localhost:4000";
const TOKEN_KEY = "umuhuza_token";

export function mediaUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${UPLOAD_URL}${path}`;
}

export function formatPrice(price: number, currency = "RWF") {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

type ApiOptions = RequestInit & { json?: unknown };

export class ApiError extends Error {
  status: number;
  code?: string;
  amount?: number;
  propertyId?: string;
  constructor(
    message: string,
    status: number,
    extra?: { code?: string; amount?: number; propertyId?: string }
  ) {
    super(message);
    this.status = status;
    this.code = extra?.code;
    this.amount = extra?.amount;
    this.propertyId = extra?.propertyId;
  }
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  let body = options.body;

  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.json);
  }

  const token = getStoredToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body,
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      typeof data.error === "string" ? data.error : "Request failed",
      res.status,
      {
        code: typeof data.code === "string" ? data.code : undefined,
        amount: typeof data.amount === "number" ? data.amount : undefined,
        propertyId: typeof data.propertyId === "string" ? data.propertyId : undefined,
      }
    );
  }
  return data as T;
}
