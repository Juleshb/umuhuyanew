"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/api";
import { PaymentCheckout } from "@/components/payment-checkout";

const freeStart = {
  name: "Get started",
  priceLabel: "Free",
  subtitle: "Explore Rwanda homes with no payment",
  points: [
    "Browse approved listings nationwide",
    "Filter by buy, rent, district & map",
    "Save favorites and create an account",
    "Upgrade only when you need contact or posting",
  ],
  cta: { href: "/register", label: "Create free account" },
  secondary: { href: "/properties", label: "Browse properties" },
};

const paidPlans = [
  {
    id: "unlock",
    name: "Contact unlock",
    amount: 5000,
    badge: "Buyers & renters",
    period: "Per property · 7 days",
    summary: "Unlock seller details and arrange a visit.",
    points: [
      "View agent phone & email",
      "Send inquiries and meeting requests",
      "Access valid for one full week",
      "Covers visiting coordination",
    ],
    cta: { href: "/properties", label: "Find a home to unlock" },
    featured: false,
  },
  {
    id: "agent",
    name: "Agent Pro",
    amount: 15000,
    badge: "Most popular for agents",
    period: "Per month",
    summary: "Activate your agent account and manage listings.",
    points: [
      "Activate agent profile for 30 days",
      "Post and edit unlimited listings",
      "Receive buyer inquiries",
      "Map pins & dashboard tools",
    ],
    cta: { href: "/register?role=AGENT", label: "Start as an agent" },
    featured: true,
  },
  {
    id: "listing",
    name: "Private listing",
    amount: 1000,
    badge: "Private sellers",
    period: "Per property · 30 days",
    summary: "Post one home without a full agent plan.",
    points: [
      "List one property for one month",
      "No monthly agent fee required",
      "Goes through admin approval",
      "Expires automatically after 30 days",
    ],
    cta: { href: "/dashboard/listings/new", label: "Post a property" },
    featured: false,
  },
] as const;

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-teal" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M4.5 10.5 8 14l7.5-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PricingPage() {
  const { user, refresh } = useAuth();
  const agentActive = user?.role === "AGENT" && user.agentActive;
  const needsActivation = user?.role === "AGENT" && !user.agentActive;

  return (
    <div className="overflow-hidden bg-white">
      {/* Hero */}
      <section className="relative isolate">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 10% 0%, rgba(15,158,168,0.18), transparent 55%), radial-gradient(ellipse 60% 50% at 90% 20%, rgba(242,107,29,0.12), transparent 50%), linear-gradient(180deg, #eef6f7 0%, #ffffff 70%)",
          }}
        />
        <div className="mx-auto max-w-6xl px-4 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-14">
          <p className="animate-fade text-[11px] font-bold uppercase tracking-[0.2em] text-teal">
            Umuhuza Pricing
          </p>
          <h1 className="animate-rise mt-3 max-w-3xl font-display text-4xl leading-[1.1] text-[#0b1c2c] sm:text-5xl md:text-6xl">
            Start free. Pay only when you connect or list.
          </h1>
          <p className="animate-rise-delay mt-4 max-w-2xl text-base leading-relaxed text-ink/65 sm:text-lg">
            Browse Rwanda properties at no cost. Unlock contact for visits, activate as an agent,
            or post a private listing — clear fees, no surprises.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={user ? "/properties" : "/register"}
              className="inline-flex h-12 items-center rounded-full bg-teal px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,158,168,0.35)] transition hover:bg-teal-deep"
            >
              {user ? "Browse homes" : "Get started free"}
            </Link>
            <Link
              href="/register?role=AGENT"
              className="inline-flex h-12 items-center rounded-full border border-[#0b1c2c]/15 bg-white/70 px-6 text-sm font-semibold text-[#0b1c2c] backdrop-blur transition hover:bg-white"
            >
              Become an agent
            </Link>
          </div>
        </div>
      </section>

      {/* Free + paid plans */}
      <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-4">
          {/* Free Get Started */}
          <article className="relative flex flex-col overflow-hidden rounded-[1.75rem] border border-teal/25 bg-[linear-gradient(160deg,#ffffff_0%,#f0fafa_100%)] p-6 shadow-[0_18px_50px_rgba(11,28,44,0.06)] lg:col-span-1">
            <span className="inline-flex w-fit rounded-full bg-teal px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
              Recommended start
            </span>
            <h2 className="mt-4 font-display text-2xl text-[#0b1c2c]">{freeStart.name}</h2>
            <p className="mt-1 text-sm text-ink/60">{freeStart.subtitle}</p>
            <p className="mt-5 font-display text-4xl text-[#0b1c2c]">{freeStart.priceLabel}</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-ink/70">
              {freeStart.points.map((point) => (
                <li key={point} className="flex gap-2.5">
                  <CheckIcon />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-2">
              <Link
                href={user ? freeStart.secondary.href : freeStart.cta.href}
                className="inline-flex h-11 items-center justify-center rounded-full bg-teal text-sm font-semibold text-white hover:bg-teal-deep"
              >
                {user ? freeStart.secondary.label : freeStart.cta.label}
              </Link>
              {!user ? (
                <Link
                  href={freeStart.secondary.href}
                  className="inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold text-teal hover:underline"
                >
                  {freeStart.secondary.label}
                </Link>
              ) : null}
            </div>
          </article>

          {/* Paid plans */}
          <div className="grid gap-5 sm:grid-cols-3 lg:col-span-3">
            {paidPlans.map((plan) => (
              <article
                key={plan.id}
                className={`relative flex flex-col rounded-[1.75rem] border p-6 transition ${
                  plan.featured
                    ? "border-teal/40 bg-[#0b1c2c] text-white shadow-[0_24px_60px_rgba(11,28,44,0.28)]"
                    : "border-black/5 bg-white shadow-[0_16px_40px_rgba(11,28,44,0.06)]"
                }`}
              >
                {plan.featured ? (
                  <span className="absolute -top-3 left-6 rounded-full bg-orange px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                    {plan.badge}
                  </span>
                ) : (
                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                      plan.featured ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}

                <h2
                  className={`mt-4 font-display text-2xl ${
                    plan.featured ? "text-white" : "text-[#0b1c2c]"
                  }`}
                >
                  {plan.name}
                </h2>
                <p className={`mt-1 text-sm ${plan.featured ? "text-white/65" : "text-ink/60"}`}>
                  {plan.summary}
                </p>
                <div className="mt-5">
                  <p
                    className={`font-display text-4xl ${
                      plan.featured ? "text-white" : "text-teal"
                    }`}
                  >
                    {formatPrice(plan.amount, "RWF")}
                  </p>
                  <p
                    className={`mt-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                      plan.featured ? "text-white/45" : "text-ink/40"
                    }`}
                  >
                    {plan.period}
                  </p>
                </div>
                <ul
                  className={`mt-6 flex-1 space-y-3 text-sm ${
                    plan.featured ? "text-white/75" : "text-ink/70"
                  }`}
                >
                  {plan.points.map((point) => (
                    <li key={point} className="flex gap-2.5">
                      <svg
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          plan.featured ? "text-teal" : "text-teal"
                        }`}
                        viewBox="0 0 20 20"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M4.5 10.5 8 14l7.5-8"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={
                    plan.id === "agent" && user?.role === "AGENT"
                      ? "/dashboard/listings"
                      : plan.id === "listing" && !user
                        ? `/login?next=${encodeURIComponent("/dashboard/listings/new")}`
                        : plan.cta.href
                  }
                  className={`mt-8 inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold transition ${
                    plan.featured
                      ? "bg-teal text-white hover:bg-teal-deep"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {plan.id === "agent" && agentActive
                    ? "Manage listings"
                    : plan.id === "agent" && needsActivation
                      ? "Activate below"
                      : plan.cta.label}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Activate / status strip */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {needsActivation ? (
          <PaymentCheckout
            kind="AGENT_SUBSCRIPTION"
            amount={15000}
            title="Activate Agent Pro"
            description="Confirm 15,000 RWF to activate your agent account for one month and start listing."
            onPaid={() => void refresh()}
          />
        ) : (
          <div className="grid gap-4 overflow-hidden rounded-[1.75rem] border border-black/5 bg-[#0b1c2c] p-6 text-white sm:grid-cols-[1.4fr_1fr] sm:p-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal">
                Ready when you are
              </p>
              <h3 className="mt-2 font-display text-3xl">
                {agentActive
                  ? "Your agent plan is active"
                  : "Pick a path and get started today"}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">
                {agentActive
                  ? `Active until ${
                      user?.agentActiveUntil
                        ? new Date(user.agentActiveUntil).toLocaleDateString()
                        : "—"
                    }. Keep listing, answering inquiries, and growing your pipeline.`
                  : "Create a free account to browse and save homes. Upgrade only when you need contact unlock, agent tools, or a private listing."}
              </p>
            </div>
            <div className="flex flex-col justify-center gap-3 sm:items-end">
              <Link
                href={user ? "/dashboard" : "/register"}
                className="inline-flex h-11 items-center justify-center rounded-full bg-teal px-5 text-sm font-semibold text-white hover:bg-teal-deep"
              >
                {user ? "Open dashboard" : "Get started free"}
              </Link>
              <Link
                href="/properties/map"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white hover:bg-white/5"
              >
                Explore map search
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="border-t border-black/5 bg-[#f7fbfb]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal">
              How billing works
            </p>
            <h2 className="mt-2 font-display text-3xl text-[#0b1c2c]">
              Three clear steps from browse to close
            </h2>
          </div>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Get started free",
                text: "Create an account, browse listings, save favorites, and explore the map — no payment needed.",
              },
              {
                step: "02",
                title: "Unlock or activate",
                text: "Pay 5,000 RWF to contact a seller for a week, or 15,000 RWF/month to run as an agent.",
              },
              {
                step: "03",
                title: "List or visit",
                text: "Private sellers post for 1,000 RWF per month-long listing. Buyers inquire and arrange visits.",
              },
            ].map((item) => (
              <li key={item.step} className="relative pt-2">
                <p className="font-display text-4xl text-teal/25">{item.step}</p>
                <h3 className="mt-2 text-lg font-semibold text-[#0b1c2c]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ-ish trust */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal">Trust</p>
            <h2 className="mt-2 font-display text-3xl text-[#0b1c2c]">
              Transparent fees for Rwanda’s property market
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/65">
              Umuhuza keeps browsing free so more people can discover homes. You only pay when
              value is clear — contacting a seller, running an agent account, or publishing a
              private listing.
            </p>
          </div>
          <div className="space-y-3">
            {[
              {
                q: "Do I pay to browse?",
                a: "No. Searching, filtering, and map explore are free.",
              },
              {
                q: "What does 5,000 RWF cover?",
                a: "One week of seller/agent contact, inquiries, and visit coordination for that listing.",
              },
              {
                q: "What if my private listing expires?",
                a: "After 30 days it leaves public browse. You can post again with another 1,000 RWF fee.",
              },
            ].map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-black/5 bg-white px-5 py-4 shadow-sm"
              >
                <p className="font-semibold text-[#0b1c2c]">{item.q}</p>
                <p className="mt-1 text-sm text-ink/60">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
