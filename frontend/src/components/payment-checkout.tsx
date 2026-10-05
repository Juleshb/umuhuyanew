"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api, formatPrice } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type PaymentKind = "CONTACT_UNLOCK" | "AGENT_SUBSCRIPTION" | "LISTING_FEE";

type Props = {
  kind: PaymentKind;
  propertyId?: string;
  amount: number;
  title: string;
  description: string;
  onPaid?: () => void;
  className?: string;
};

type MobileOption = {
  country: string;
  countryCode: string;
  paymentName: string;
  logo: string | null;
  cellularPrefix: string | null;
  instructions: string | null;
};

type CheckoutResponse = {
  data: {
    id: string;
    reference: string;
    amount: number;
    currency: string;
    provider?: string | null;
    providerToken?: string | null;
  };
  paymentUrl?: string | null;
  mobileOptions?: MobileOption[];
  sandbox?: boolean;
  instructions?: { note?: string; provider?: string };
};

const MTN_ICON = "/payments/mtn-momo.svg";
const AIRTEL_ICON = "/payments/airtel-money.svg";

const DEFAULT_PUSH_INSTRUCTION =
  "Shortly, you will receive a push prompt on your phone to enter your MoMo PIN and authorize the payment.";

const MTN_DELAY_INSTRUCTION =
  "If the popup is delayed on MTN MoMo, dial *128*7*1# then accept and follow the instructions to complete payment.";

function isAirtel(name: string) {
  return name.toLowerCase().includes("airtel");
}

function isMtn(name: string) {
  return name.toLowerCase().includes("mtn");
}

function displayMnoLabel(name: string) {
  if (isAirtel(name)) return "Airtel Money";
  if (isMtn(name)) return "MTN MoMo";
  return name;
}

function mnoIcon(name: string, remoteLogo?: string | null) {
  if (isAirtel(name)) return AIRTEL_ICON;
  if (isMtn(name)) return MTN_ICON;
  return remoteLogo || MTN_ICON;
}

function buildWaitingInstructions(base: string | null | undefined, mnoName: string) {
  const main = (base || DEFAULT_PUSH_INSTRUCTION).trim();
  if (isMtn(mnoName)) {
    return `${main}\n\n${MTN_DELAY_INSTRUCTION}`;
  }
  return main;
}

function defaultPhone(userPhone?: string | null) {
  if (!userPhone) return "";
  const digits = userPhone.replace(/\D/g, "");
  if (digits.startsWith("250") && digits.length === 12) return `0${digits.slice(3)}`;
  if (digits.startsWith("0")) return digits;
  if (digits.length === 9) return `0${digits}`;
  return userPhone;
}

function MnoBadge({ name, logo, size = "md" }: { name: string; logo?: string | null; size?: "sm" | "md" }) {
  const px = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  return (
    <span className="inline-flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mnoIcon(name, logo)}
        alt=""
        className={`${px} rounded-lg object-cover shadow-sm`}
      />
      <span>{displayMnoLabel(name)}</span>
    </span>
  );
}

function DpoPaymentModal({
  open,
  url,
  onClose,
  onCheckPaid,
  checking,
}: {
  open: boolean;
  url: string | null;
  onClose: () => void;
  onCheckPaid: () => void;
  checking: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted || !open || !url) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0b1c2c]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="DPO payment"
      onClick={onClose}
    >
      <div
        className="flex h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[85vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#e8edf2] px-4 py-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal">
              Secure DPO payment
            </p>
            <p className="text-sm text-ink/60">Complete MoMo or card payment below</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-[#e4e8ee] px-3 py-1.5 text-sm text-ink/70 hover:bg-[#f5f7f9]"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <iframe
          title="DPO payment"
          src={url}
          className="min-h-0 flex-1 w-full bg-white"
          allow="payment *"
        />
        <div className="flex gap-2 border-t border-[#e8edf2] bg-[#f8fafb] px-4 py-3">
          <button type="button" className="btn btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary flex-1"
            disabled={checking}
            onClick={onCheckPaid}
          >
            {checking ? "Checking…" : "I've paid"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function PaymentCheckout({
  kind,
  propertyId,
  amount,
  title,
  description,
  onPaid,
  className = "",
}: Props) {
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<CheckoutResponse["data"] | null>(null);
  const [provider, setProvider] = useState<"DPO" | "DEMO" | null>(null);
  const [options, setOptions] = useState<MobileOption[]>([]);
  const [selectedMno, setSelectedMno] = useState("");
  const [phone, setPhone] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [instructions, setInstructions] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [sandbox, setSandbox] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedOption =
    options.find((o) => o.paymentName === selectedMno) ?? options[0] ?? null;
  const modalUrl = redirectUrl || paymentUrl;

  useEffect(() => {
    setPhone(defaultPhone(user?.phone));
  }, [user?.phone]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function markPaidLocally() {
    setPaid(true);
    setWaiting(false);
    setModalOpen(false);
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    await refresh();
    onPaid?.();
  }

  function startPolling(paymentId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      void (async () => {
        try {
          const statusRes = await api<{ data: { status: string } }>(
            `/billing/${paymentId}/status`
          );
          if (statusRes.data.status === "PAID") {
            await markPaidLocally();
          }
        } catch {
          // keep waiting; user can still cancel
        }
      })();
    }, 4000);
  }

  function openDpoModal(url?: string | null) {
    if (!url) return;
    setRedirectUrl(url);
    setModalOpen(true);
  }

  async function startCheckout() {
    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api<CheckoutResponse>("/billing/checkout", {
        method: "POST",
        json: { kind, propertyId },
      });
      setPayment(res.data);
      const mode = (res.instructions?.provider || res.data.provider || "DEMO") as
        | "DPO"
        | "DEMO";
      setProvider(mode);
      setSandbox(Boolean(res.sandbox));
      setPaymentUrl(res.paymentUrl || null);

      if (mode === "DPO") {
        const list = res.mobileOptions?.length
          ? res.mobileOptions
          : [
              {
                country: "rwanda",
                countryCode: "RW",
                paymentName: "MTN",
                logo: MTN_ICON,
                cellularPrefix: "250",
                instructions: null,
              },
              {
                country: "rwanda",
                countryCode: "RW",
                paymentName: "AirtelRW",
                logo: AIRTEL_ICON,
                cellularPrefix: "250",
                instructions: null,
              },
            ];
        setOptions(list);
        setSelectedMno(list[0]?.paymentName ?? "MTN");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment");
    } finally {
      setLoading(false);
    }
  }

  async function sendMomoPush() {
    if (!payment || !selectedOption) return;

    setSending(true);
    setError(null);
    try {
      const res = await api<{
        paid?: boolean;
        sandbox?: boolean;
        charge: {
          instructions: string;
          explanation: string;
          redirectOption?: boolean;
          redirectUrl?: string | null;
        };
      }>(`/billing/${payment.id}/charge-mobile`, {
        method: "POST",
        json: {
          phoneNumber: phone,
          mno: selectedOption.paymentName,
          mnoCountry: selectedOption.country,
        },
      });

      if (res.paid) {
        await markPaidLocally();
        return;
      }

      if (res.sandbox) setSandbox(true);
      const dpoUrl = res.charge.redirectUrl || paymentUrl;
      setRedirectUrl(dpoUrl || null);
      setInstructions(
        buildWaitingInstructions(res.charge.instructions, selectedOption.paymentName)
      );
      setWaiting(true);
      startPolling(payment.id);
      if (dpoUrl) setModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send MoMo prompt");
    } finally {
      setSending(false);
    }
  }

  async function confirmPaid() {
    if (!payment) return;
    setConfirming(true);
    setError(null);
    try {
      await api(`/billing/${payment.id}/confirm`, { method: "POST" });
      await markPaidLocally();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm payment");
    } finally {
      setConfirming(false);
    }
  }

  function cancelWaiting() {
    setWaiting(false);
    setInstructions(null);
    setRedirectUrl(null);
    setModalOpen(false);
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function resetCheckout() {
    cancelWaiting();
    setPayment(null);
    setProvider(null);
    setOptions([]);
    setPaid(false);
    setSandbox(false);
    setPaymentUrl(null);
    setError(null);
  }

  return (
    <div className={`rounded-3xl border border-teal/20 bg-teal/5 p-5 ${className}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal">
        Mobile Money Payment
      </p>
      <h3 className="mt-1 font-display text-xl text-[#0b1c2c]">{title}</h3>
      <p className="mt-2 text-sm text-ink/65">{description}</p>
      <p className="mt-3 text-2xl font-bold text-teal">{formatPrice(amount, "RWF")}</p>
      <div className="mt-2 flex items-center gap-3 text-xs text-ink/55">
        <span className="inline-flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MTN_ICON} alt="" className="h-5 w-5 rounded" />
          MTN MoMo
        </span>
        <span className="inline-flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={AIRTEL_ICON} alt="" className="h-5 w-5 rounded" />
          Airtel Money
        </span>
      </div>

      {sandbox ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
          You are using <strong>DPO sandbox</strong> keys. Sandbox does not send a real MoMo
          popup to your phone, so verify will stay on “Transaction not paid yet” until you
          use live merchant credentials from the DPO portal.
        </div>
      ) : null}

      {paid ? (
        <div className="mt-4 rounded-2xl border border-teal/25 bg-white px-4 py-3 text-sm text-teal">
          Payment confirmed. Access is active.
        </div>
      ) : !payment ? (
        <button
          type="button"
          className="btn btn-primary mt-4 w-full"
          disabled={loading}
          onClick={() => void startCheckout()}
        >
          {loading ? "Preparing…" : `Pay ${formatPrice(amount, "RWF")}`}
        </button>
      ) : provider === "DEMO" ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-white/60 bg-white px-4 py-3 text-sm">
            <p className="text-ink/50">Payment reference</p>
            <p className="font-semibold text-[#0b1c2c]">{payment.reference}</p>
            <p className="mt-2 text-xs text-ink/55">
              Demo mode (DPO keys not configured). Confirm to activate locally.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary w-full"
            disabled={confirming}
            onClick={() => void confirmPaid()}
          >
            {confirming ? "Activating…" : "I've paid — activate access"}
          </button>
        </div>
      ) : waiting ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-[#d8dee6] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ink/55">Payment ID: {payment.reference}</p>
            {selectedOption ? (
              <MnoBadge name={selectedOption.paymentName} logo={selectedOption.logo} size="sm" />
            ) : null}
          </div>
          <p className="text-sm font-medium text-[#0b1c2c]">Phone Number</p>
          <div className="rounded-xl bg-[#f3f5f7] px-3 py-2.5 text-sm text-[#0b1c2c]">
            {phone}
          </div>
          <div className="rounded-xl border border-[#e4e8ee] px-3 py-3 text-sm text-ink/75">
            <p className="font-semibold text-[#0b1c2c]">Please follow these instructions:</p>
            <p className="mt-2 whitespace-pre-line leading-relaxed">
              {instructions ||
                buildWaitingInstructions(DEFAULT_PUSH_INSTRUCTION, selectedMno || "MTN")}
            </p>
            {isMtn(selectedMno) ? (
              <p className="mt-3 rounded-lg bg-[#FFF8DB] px-3 py-2 text-sm font-medium text-[#5C4B00]">
                Popup delayed? Dial <span className="font-bold tracking-wide">*128*7*1#</span>,
                then accept and follow the on-screen steps.
              </p>
            ) : null}
            {sandbox ? (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
                No phone popup expected in sandbox. Use the DPO window on this site, or switch
                to live merchant credentials.
              </p>
            ) : null}
            <p className="mt-3 text-xs text-ink/45">Waiting for confirmation…</p>
          </div>
          {modalUrl ? (
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={() => openDpoModal(modalUrl)}
            >
              Open DPO payment window
            </button>
          ) : null}
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost flex-1" onClick={cancelWaiting}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary flex-1"
              disabled={confirming}
              onClick={() => void confirmPaid()}
            >
              {confirming ? "Checking…" : "I've approved"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3 rounded-2xl border border-[#d8dee6] bg-white p-4">
          <p className="text-sm text-ink/55">Payment ID: {payment.reference}</p>

          <div>
            <span className="text-sm font-medium text-[#0b1c2c]">Network</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {options.map((opt) => {
                const active = selectedMno === opt.paymentName;
                return (
                  <button
                    key={`${opt.paymentName}-${opt.country}`}
                    type="button"
                    onClick={() => setSelectedMno(opt.paymentName)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                      active
                        ? "border-teal bg-teal/10 text-teal"
                        : "border-[#e4e8ee] bg-[#f8f9fb] text-ink/70"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mnoIcon(opt.paymentName, opt.logo)}
                      alt=""
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                    {displayMnoLabel(opt.paymentName)}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-[#0b1c2c]">Phone Number</span>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="078XXXXXXX"
              className="mt-1.5 w-full rounded-xl border border-[#e4e8ee] bg-[#f3f5f7] px-3 py-2.5 text-sm text-[#0b1c2c] outline-none ring-teal/30 focus:ring-2"
            />
          </label>

          <button
            type="button"
            className="btn btn-primary w-full"
            disabled={sending || phone.replace(/\D/g, "").length < 9}
            onClick={() => void sendMomoPush()}
          >
            {sending ? "Opening DPO…" : "Pay with MoMo"}
          </button>
          {paymentUrl ? (
            <button
              type="button"
              className="btn btn-ghost w-full"
              onClick={() => {
                setWaiting(true);
                startPolling(payment.id);
                openDpoModal(paymentUrl);
              }}
            >
              Open DPO checkout window
            </button>
          ) : null}
          <button type="button" className="btn btn-ghost w-full" onClick={resetCheckout}>
            Cancel
          </button>
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-orange">{error}</p> : null}

      <DpoPaymentModal
        open={modalOpen}
        url={modalUrl}
        onClose={() => setModalOpen(false)}
        checking={confirming}
        onCheckPaid={() => void confirmPaid()}
      />
    </div>
  );
}
