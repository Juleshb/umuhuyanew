/** Platform pricing (RWF) and entitlement helpers */

export const PRICING = {
  CONTACT_UNLOCK: 5_000,
  AGENT_SUBSCRIPTION: 15_000,
  LISTING_FEE: 1_000,
} as const;

export const DURATIONS = {
  CONTACT_UNLOCK_DAYS: 7,
  AGENT_SUBSCRIPTION_DAYS: 30,
  LISTING_FEE_DAYS: 30,
} as const;

export function addDays(from: Date, days: number) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

export function isAgentSubscriptionActive(
  user: { role: string; agentActiveUntil?: Date | null } | null | undefined
) {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.role !== "AGENT") return false;
  return Boolean(user.agentActiveUntil && user.agentActiveUntil.getTime() > Date.now());
}

export function isListingLive(property: {
  status: string;
  expiresAt?: Date | null;
}) {
  if (property.status !== "APPROVED" && property.status !== "SOLD" && property.status !== "RENTED") {
    return false;
  }
  if (property.status === "SOLD" || property.status === "RENTED") return true;
  if (!property.expiresAt) return true;
  return property.expiresAt.getTime() > Date.now();
}

export function publicListingWhere(now = new Date()) {
  return {
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}
