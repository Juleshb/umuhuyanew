import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "UmuhuzaOnline.com is a property discovery platform owned, operated and managed by Shima Prime Services Ltd.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-clay">About UmuhuzaOnline.com</p>
      <h1 className="mt-3 font-display text-4xl text-forest sm:text-5xl">
        Welcome to UmuhuzaOnline.com — Your Property Discovery Platform
      </h1>
      <div className="mt-8 space-y-5 text-lg leading-relaxed text-ink/80">
        <p>
          Discover properties and accommodation in one convenient place. Whether you are looking to
          buy, sell, rent, or explore houses, plots, apartments, lodges, and other properties,
          UmuhuzaOnline.com is here to make your search easier.
        </p>
        <p>
          Our mission is to connect people with the right properties and help property owners reach
          more potential clients.
        </p>
        <p className="font-semibold text-[#0b1c2c]">Discover. Connect. Find Your Place.</p>
        <p>
          UmuhuzaOnline.com is a real-estate brand and digital platform owned, operated and managed
          by Shima Prime Services Ltd. Shima Prime Services Ltd is the legal entity responsible for
          the management and operation of the platform and its related real-estate services.
        </p>
        <p>
          Rwanda is a rapidly growing country. Residents are settling in Kigali and other urban
          areas outside the capital — joyfully building homes, businesses, and communities. We are
          also a touristic country, welcoming more than a million visitors every year.
        </p>
        <p>
          In a market that moves this quickly, people need a clear way to discover homes for sale
          or rent, reach trusted agents, and move from interest to conversation. UmuhuzaOnline
          brings buyers, renters, landlords, and agents together in one place.
        </p>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/properties" className="btn btn-primary">
          Explore listings
        </Link>
        <Link href="/terms" className="btn btn-secondary">
          Terms
        </Link>
        <Link href="/privacy" className="btn btn-secondary">
          Privacy
        </Link>
      </div>
    </div>
  );
}
