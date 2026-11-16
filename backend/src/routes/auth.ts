import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { verifyGoogleIdToken } from "../lib/google";
import {
  authenticate,
  clearAuthCookie,
  setAuthCookie,
  signToken,
} from "../middleware/auth";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(["BUYER", "AGENT"]).default("BUYER"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleSchema = z.object({
  idToken: z.string().min(20),
  role: z.enum(["BUYER", "AGENT"]).optional(),
});

function publicUser(user: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  avatarUrl: string | null;
  createdAt: Date;
  agentActiveUntil?: Date | null;
}) {
  const agentActive =
    user.role === Role.ADMIN ||
    (user.role === Role.AGENT &&
      Boolean(user.agentActiveUntil && user.agentActiveUntil.getTime() > Date.now()));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    agentActiveUntil: user.agentActiveUntil ?? null,
    agentActive,
  };
}

function issueSession(
  res: import("express").Response,
  user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: Role;
    avatarUrl: string | null;
    createdAt: Date;
    agentActiveUntil?: Date | null;
  },
  status = 200
) {
  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  setAuthCookie(res, token);
  return res.status(status).json({ user: publicUser(user), token });
}

router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        phone: data.phone,
        role: data.role as Role,
      },
    });

    return issueSession(res, user, 201);
  } catch (err) {
    return next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        error: "This account uses Google sign-in. Continue with Google instead.",
      });
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    return issueSession(res, user);
  } catch (err) {
    return next(err);
  }
});

router.post("/google", async (req, res, next) => {
  try {
    const data = googleSchema.parse(req.body);
    const profile = await verifyGoogleIdToken(data.idToken);

    if (!profile.emailVerified) {
      return res.status(401).json({ error: "Google email is not verified" });
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: profile.googleId }, { email: profile.email }],
      },
    });
    let created = false;

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId ?? profile.googleId,
          avatarUrl: user.avatarUrl || profile.avatarUrl,
          name: user.name || profile.name,
        },
      });
    } else {
      created = true;
      user = await prisma.user.create({
        data: {
          email: profile.email,
          googleId: profile.googleId,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
          role: (data.role as Role | undefined) ?? Role.BUYER,
          passwordHash: null,
        },
      });
    }

    return issueSession(res, user, created ? 201 : 200);
  } catch (err) {
    if (err instanceof Error && /not configured|token|audience|Invalid/i.test(err.message)) {
      return res.status(401).json({ error: err.message });
    }
    return next(err);
  }
});

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  return res.json({ ok: true });
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    return res.json({ user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
});

export default router;
