import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../lib/env";
import type { AuthUser } from "../types/express";

const COOKIE_NAME = "umuhuza_token";

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token = bearer || req.cookies?.[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token = bearer || req.cookies?.[COOKIE_NAME];

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
  } catch {
    // ignore invalid token for optional auth
  }

  return next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    return next();
  };
}
