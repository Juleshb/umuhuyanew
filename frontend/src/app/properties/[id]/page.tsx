"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, formatPrice, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatLocation, formatLocationLines } from "@/lib/location";
import { hasCoordinates } from "@/lib/map";
import { PropertyMap } from "@/components/map";
import { PropertyShare } from "@/components/property-share";
import { PaymentCheckout } from "@/components/payment-checkout";
import type { Property } from "@/lib/types";

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["property", params.id],
    queryFn: () => api<{ data: Property }>(`/properties/${params.id}`),
  });

  const favoriteMutation = useMutation({
    mutationFn: () => api(`/favorites/${params.id}`, { method: "POST" }),
    onSuccess: () => {
      setNotice("Saved to favorites.");
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: (err: Error) => setNotice(err.message),
  });

  const inquiryMutation = useMutation({
    mutationFn: () =>
      api("/inquiries", {
        method: "POST",
        json: { propertyId: params.id, message },
      }),
    onSuccess: () => {
      setMessage("");
      setNotice("Inquiry sent to the agent.");
      void queryClient.invalidateQueries({ queryKey: ["inquiries"] });
    },
    onError: (err: Error) => setNotice(err.message),
  });

  const property = data?.data;
  const images = useMemo(() => {
    if (!property) return [];
    return property.images.length
      ? property.images
      : [{ id: "placeholder", url: "", isPrimary: true }];
  }, [property]);

  useEffect(() => {
    setActiveImage(0);
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-100" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_0.9fr]">
          <div className="aspect-[16/10] animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-96 animate-pulse rounded-3xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <p className="font-display text-2xl text-[#0b1c2c]">Property not found</p>
        <p className="mt-2 text-ink/60">This listing may have been removed or is unavailable.</p>
        <Link href="/properties" className="btn btn-primary mt-6 inline-flex">
          Browse properties
        </Link>
      </div>
    );
  }

  const isClosed = property.status === "SOLD" || property.status === "RENTED";
  const current = images[activeImage] ?? images[0];

  function requireAuth(action: () => void) {
    if (!user) {
      router.push(`/login?next=/properties/${params.id}`);
      return;
    }
    action();
  }

  function onInquire(e: FormEvent) {
    e.preventDefault();
    requireAuth(() => inquiryMutation.mutate());
  }

  const facts = [
    property.bedrooms != null ? { label: "Bedrooms", value: String(property.bedrooms) } : null,
    property.bathrooms != null ? { label: "Bathrooms", value: String(property.bathrooms) } : null,
    property.sizeSqm != null ? { label: "Size", value: `${property.sizeSqm} m²` } : null,
    { label: "Type", value: property.type },
    {
      label: "Listing",
      value: property.listingType === "RENT" ? "For rent" : "For sale",
    },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="bg-[linear-gradient(180deg,#f4f8f8_0%,#ffffff_28%)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/properties"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline"
          >
            ← Back to properties
          </Link>
          <PropertyShare property={property} compact />
        </div>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-teal/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-teal">
                {property.listingType === "RENT" ? "For rent" : "For sale"}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">
                {property.type}
              </span>
              {isClosed ? (
                <span className="rounded-full bg-[#0b1c2c] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                  {property.status === "SOLD" ? "Sold" : "Rented"}
                </span>
              ) : (
                <span className="rounded-full bg-orange/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-orange">
                  Available
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-3xl leading-tight text-[#0b1c2c] sm:text-4xl md:text-[2.6rem]">
              {property.title}
            </h1>
            <p className="mt-2 text-base text-ink/65">{formatLocation(property)}</p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white px-5 py-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">Price</p>
            <p
              className={`mt-1 text-2xl font-bold ${
                isClosed ? "text-ink/45 line-through" : "text-teal"
              }`}
            >
              {formatPrice(property.price, property.currency)}
              {property.listingType === "RENT" && !isClosed ? (
                <span className="text-sm font-medium text-ink/45"> / month</span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.45fr_0.9fr]">
          <div>
            <div className="overflow-hidden rounded-3xl border border-black/5 bg-slate-100 shadow-[0_20px_50px_rgba(11,28,44,0.08)]">
              <div className="relative aspect-[16/10]">
                {current?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(current.url)}
                    alt={property.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-ink/40">
                    No photos yet
                  </div>
                )}
                {images.length > 1 ? (
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/55 to-transparent p-4">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg font-semibold text-slate-800"
                      onClick={() =>
                        setActiveImage((i) => (i - 1 + images.length) % images.length)
                      }
                      aria-label="Previous photo"
                    >
                      ‹
                    </button>
                    <p className="rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white">
                      {activeImage + 1} / {images.length}
                    </p>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg font-semibold text-slate-800"
                      onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                      aria-label="Next photo"
                    >
                      ›
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {images.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, index) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`h-20 w-28 shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                      index === activeImage
                        ? "border-teal"
                        : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                  >
                    {img.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(img.url)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/40">
                    {fact.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#0b1c2c]">{fact.value}</p>
                </div>
              ))}
            </div>

            <section className="mt-10">
              <h2 className="font-display text-2xl text-[#0b1c2c]">About this property</h2>
              <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-ink/75">
                {property.description}
              </p>
            </section>

            <section className="mt-10 rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal">
                    Location
                  </p>
                  <h2 className="mt-1 font-display text-2xl text-[#0b1c2c]">Where it is</h2>
                </div>
                <Link
                  href="/properties/map"
                  className="text-sm font-semibold text-teal hover:underline"
                >
                  Open map search
                </Link>
              </div>

              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {formatLocationLines(property).map((line) => {
                  const [label, value] = line.split(": ");
                  return (
                    <div key={line} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <dt className="text-xs text-ink/45">{label}</dt>
                      <dd className="mt-0.5 text-sm font-semibold text-[#0b1c2c]">{value}</dd>
                    </div>
                  );
                })}
              </dl>
              {property.address ? (
                <p className="mt-4 text-sm text-ink/65">
                  <span className="font-semibold text-[#0b1c2c]">Street / landmark: </span>
                  {property.address}
                </p>
              ) : null}

              {hasCoordinates(property) ? (
                <div className="mt-5 overflow-hidden rounded-2xl border border-black/5">
                  <PropertyMap
                    properties={[property]}
                    selectedId={property.id}
                    heightClassName="h-72 sm:h-80"
                    showPopupLinks={false}
                  />
                </div>
              ) : null}
            </section>

            <section className="mt-10 rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal">
                Share listing
              </p>
              <h2 className="mt-1 font-display text-2xl text-[#0b1c2c]">
                Send this home to someone
              </h2>
              <p className="mt-2 max-w-xl text-sm text-ink/60">
                Share via WhatsApp, Facebook, X, Telegram, email, or copy the link.
              </p>
              <div className="mt-5">
                <PropertyShare property={property} />
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-[0_16px_40px_rgba(11,28,44,0.08)] sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal/10 text-base font-bold text-teal">
                  {property.agent.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal">
                    Listing agent
                  </p>
                  <p className="mt-0.5 truncate text-lg font-semibold text-[#0b1c2c]">
                    {property.agent.name}
                  </p>
                  {property.contactUnlocked ? (
                    <>
                      {property.agent.phone ? (
                        <a
                          href={`tel:${property.agent.phone}`}
                          className="text-sm text-ink/60 hover:text-teal"
                        >
                          {property.agent.phone}
                        </a>
                      ) : (
                        <p className="text-sm text-ink/50">{property.agent.email}</p>
                      )}
                      {property.unlockExpiresAt ? (
                        <p className="mt-1 text-xs text-ink/45">
                          Access until{" "}
                          {new Date(property.unlockExpiresAt).toLocaleDateString()}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm text-ink/50">Contact locked — unlock to view & inquire</p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  className="btn btn-secondary w-full"
                  onClick={() => requireAuth(() => favoriteMutation.mutate())}
                  disabled={favoriteMutation.isPending}
                >
                  {favoriteMutation.isPending ? "Saving…" : "Save to favorites"}
                </button>
                <PropertyShare property={property} compact />
              </div>

              {!isClosed && !property.contactUnlocked && user?.id !== property.agentId ? (
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <PaymentCheckout
                    kind="CONTACT_UNLOCK"
                    propertyId={property.id}
                    amount={property.contactUnlockPrice ?? 5000}
                    title="Unlock contact & visit"
                    description="Pay once to view seller/agent details, send inquiries, and arrange a visit. Access lasts 1 week."
                    onPaid={() => {
                      void queryClient.invalidateQueries({
                        queryKey: ["property", params.id],
                      });
                      setNotice("Contact unlocked for 1 week.");
                    }}
                  />
                </div>
              ) : null}

              {isClosed ? (
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <h2 className="font-display text-xl text-[#0b1c2c]">Inquiries closed</h2>
                  <p className="mt-2 text-sm text-ink/65">
                    This home is {property.status === "SOLD" ? "sold" : "rented"}. Browse other
                    available listings instead.
                  </p>
                  <Link
                    href="/properties"
                    className="btn btn-primary mt-4 inline-flex w-full justify-center"
                  >
                    Browse available homes
                  </Link>
                </div>
              ) : property.contactUnlocked || user?.id === property.agentId ? (
                <form
                  onSubmit={onInquire}
                  className="mt-6 space-y-3 border-t border-slate-100 pt-6"
                >
                  <h2 className="font-display text-xl text-[#0b1c2c]">Contact agent</h2>
                  <p className="text-sm text-ink/60">
                    Ask a question or request a viewing. The agent will reply to your account.
                  </p>
                  <textarea
                    className="input min-h-28 rounded-2xl"
                    placeholder="Hi, I’m interested in this property…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={inquiryMutation.isPending}
                  >
                    {inquiryMutation.isPending ? "Sending…" : "Send inquiry"}
                  </button>
                </form>
              ) : null}

              {notice ? (
                <p className="mt-4 rounded-xl bg-teal/10 px-3 py-2 text-sm font-medium text-teal">
                  {notice}
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
