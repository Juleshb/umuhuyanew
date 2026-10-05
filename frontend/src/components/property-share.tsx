"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/api";
import { formatLocation } from "@/lib/location";
import type { Property } from "@/lib/types";

type Props = {
  property: Pick<
    Property,
    "id" | "title" | "price" | "currency" | "listingType" | "district" | "province" | "sector" | "type"
  >;
  className?: string;
  compact?: boolean;
};

function buildShareText(property: Props["property"], url: string) {
  const price = formatPrice(property.price, property.currency);
  const rent = property.listingType === "RENT" ? " / month" : "";
  const place = formatLocation(property, { compact: true });
  return `${property.title} — ${price}${rent} · ${place}\n${url}`;
}

export function PropertyShare({ property, className = "", compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    if (typeof window === "undefined") return `https://umuhuza.rw/properties/${property.id}`;
    return `${window.location.origin}/properties/${property.id}`;
  }, [property.id]);

  const text = useMemo(() => buildShareText(property, url), [property, url]);
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  const encodedTitle = encodeURIComponent(property.title);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `${property.title} — ${formatPrice(property.price, property.currency)}`,
          url,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to menu
      }
    }
    setOpen((v) => !v);
  }

  const channels = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedText}`,
      color: "bg-[#25D366]",
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "bg-[#1877F2]",
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: "bg-[#111111]",
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      color: "bg-[#229ED9]",
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodedTitle}&body=${encodedText}`,
      color: "bg-teal",
    },
  ];

  return (
    <div className={`relative ${className}`}>
      <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : ""}`}>
        <button
          type="button"
          onClick={() => void nativeShare()}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-teal/40 hover:bg-slate-50"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
            <path
              d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Share
        </button>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-teal/40 hover:bg-slate-50"
        >
          {copied ? "Link copied" : "Copy link"}
        </button>
        {!compact ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 items-center rounded-xl px-2 text-sm font-semibold text-teal hover:underline"
            aria-expanded={open}
          >
            {open ? "Hide options" : "More"}
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-[min(100vw-2rem,320px)] rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
          <p className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-teal">
            Share this listing
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {channels.map((channel) => (
              <a
                key={channel.label}
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-teal/30 hover:bg-slate-50"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${channel.color}`} />
                {channel.label}
              </a>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void copyLink()}
            className="mt-2 flex w-full items-center justify-center rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {copied ? "Copied!" : "Copy listing link"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
