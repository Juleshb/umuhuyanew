import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

const explore = [
  { href: "/properties", label: "All properties" },
  { href: "/properties?listingType=SALE", label: "Buy a home" },
  { href: "/properties?listingType=RENT", label: "Rent a home" },
  { href: "/properties/map", label: "Map search" },
  { href: "/properties?province=Kigali%20City", label: "Kigali listings" },
];

const forAgents = [
  { href: "/register?role=AGENT", label: "Join as an agent" },
  { href: "/dashboard/listings/new", label: "List a property" },
  { href: "/dashboard/listings", label: "Manage listings" },
  { href: "/dashboard/inquiries", label: "Inquiries" },
  { href: "/about", label: "How it works" },
];

const company = [
  { href: "/about", label: "About Umuhuza" },
  { href: "/pricing", label: "Pricing" },
  { href: "/terms", label: "Terms and Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/register", label: "Create an account" },
  { href: "/login", label: "Sign in" },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm text-white/70 transition hover:text-white"
    >
      {label}
    </Link>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[#07141c] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 0% 0%, rgba(15,158,168,0.22), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(242,107,29,0.12), transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-8 sm:px-6 sm:pt-16">
        <div className="flex flex-col gap-8 border-b border-white/10 pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <BrandLogo variant="light" size="md" />
            <p className="mt-5 text-base leading-relaxed text-white/70 sm:text-lg">
              Discover properties and accommodation in one place. UmuhuzaOnline.com is owned,
              operated and managed by Shima Prime Services Ltd.
            </p>
            <p className="mt-3 text-sm font-semibold tracking-wide text-white/85">
              Discover. Connect. Find Your Place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/properties"
              className="inline-flex h-11 items-center rounded-xl bg-teal px-5 text-sm font-semibold text-white transition hover:bg-teal-deep"
            >
              Browse properties
            </Link>
            <Link
              href="/register?role=AGENT"
              className="inline-flex h-11 items-center rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              List with us
            </Link>
          </div>
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal">
              Explore
            </p>
            <ul className="mt-4 space-y-3">
              {explore.map((link) => (
                <li key={link.href}>
                  <FooterLink {...link} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal">
              For agents
            </p>
            <ul className="mt-4 space-y-3">
              {forAgents.map((link) => (
                <li key={link.label}>
                  <FooterLink {...link} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal">
              Company
            </p>
            <ul className="mt-4 space-y-3">
              {company.map((link) => (
                <li key={link.label}>
                  <FooterLink {...link} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal">
              Contact
            </p>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li>
                <span className="block text-white/45">Headquarters</span>
                Kigali, Rwanda
              </li>
              <li>
                <span className="block text-white/45">Email</span>
                <a
                  href="mailto:hello@umuhuza.rw"
                  className="transition hover:text-white"
                >
                  hello@umuhuza.rw
                </a>
              </li>
              <li>
                <span className="block text-white/45">Coverage</span>
                Provinces nationwide
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Shima Prime Services Ltd — UmuhuzaOnline.com. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/about" className="transition hover:text-white">
              About
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
