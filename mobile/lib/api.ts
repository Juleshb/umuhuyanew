import Constants from "expo-constants";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "umuhuza_token";

function lanHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.linkingUri ??
    "";
  const ip = hostUri.match(/(\d+\.\d+\.\d+\.\d+)/);
  if (ip) return ip[1];
  if (Platform.OS === "android") return "10.0.2.2";
  return "localhost";
}

const host = lanHost();

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? `http://${host}:4000/api/v1`;
export const UPLOAD_URL =
  process.env.EXPO_PUBLIC_UPLOAD_URL ?? `http://${host}:4000`;

let memoryToken: string | null = null;

export async function getStoredToken() {
  if (memoryToken) return memoryToken;
  try {
    memoryToken = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    memoryToken = null;
  }
  return memoryToken;
}

export async function setStoredToken(token: string | null) {
  memoryToken = token;
  try {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // SecureStore is unavailable on some web previews; memory fallback still works.
  }
}

export function mediaUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${UPLOAD_URL}${path}`;
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

  const token = await getStoredToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body,
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

export async function uploadImages(propertyId: string, uris: string[]) {
  const token = await getStoredToken();
  const form = new FormData();
  uris.forEach((uri, index) => {
    const name = uri.split("/").pop() || `photo-${index}.jpg`;
    form.append("images", {
      uri,
      name,
      type: "image/jpeg",
    } as unknown as Blob);
  });

  const res = await fetch(`${API_URL}/properties/${propertyId}/images`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      typeof data.error === "string" ? data.error : "Upload failed",
      res.status
    );
  }
  return data;
}
