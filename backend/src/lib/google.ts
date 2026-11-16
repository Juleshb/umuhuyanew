import { OAuth2Client } from "google-auth-library";
import { env } from "./env";

const client = new OAuth2Client();

export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
};

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (!env.GOOGLE_CLIENT_IDS.length) {
    throw new Error("Google sign-in is not configured (missing GOOGLE_CLIENT_IDS)");
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_IDS,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new Error("Google token missing required profile fields");
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name?.trim() || payload.email.split("@")[0],
    avatarUrl: payload.picture || null,
    emailVerified: Boolean(payload.email_verified),
  };
}
