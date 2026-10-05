import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, getStoredToken, setStoredToken } from "./api";
import type { Role, User } from "./types";

type RegisterInput = {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: "BUYER" | "AGENT";
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    const token = await getStoredToken();
    if (!token) {
      if (id === requestId.current) {
        setUser(null);
        setLoading(false);
      }
      return;
    }
    try {
      const data = await api<{ user: User }>("/auth/me");
      if (id !== requestId.current) return;
      setUser(data.user);
    } catch {
      if (id !== requestId.current) return;
      await setStoredToken(null);
      setUser(null);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      json: { email: email.trim().toLowerCase(), password },
    });
    requestId.current += 1;
    await setStoredToken(data.token);
    setUser(data.user);
    setLoading(false);
    return data.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const data = await api<{ user: User; token: string }>("/auth/register", {
      method: "POST",
      json: { ...input, email: input.email.trim().toLowerCase() },
    });
    requestId.current += 1;
    await setStoredToken(data.token);
    setUser(data.user);
    setLoading(false);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    requestId.current += 1;
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    await setStoredToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    [user]
  );

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh, hasRole }),
    [user, loading, login, register, logout, refresh, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
