"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type VerifyResponse = {
  data: {
    id: string;
    status: string;
    kind: string;
    propertyId?: string | null;
  };
  paid?: boolean;
  explanation?: string;
};

function ReturnContent() {
  const params = useSearchParams();
  const { refresh } = useAuth();
  const paymentId = params.get("paymentId");
  const cancelled = params.get("cancelled") === "1";
  const transactionToken =
    params.get("TransactionToken") || params.get("TransToken") || undefined;
  const companyRef = params.get("CompanyRef") || params.get("ref") || undefined;

  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "cancelled" | "error">(
    cancelled ? "cancelled" : "loading"
  );
  const [message, setMessage] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);

  useEffect(() => {
    if (cancelled || !paymentId) return;

    let cancelledFetch = false;

    async function verify() {
      try {
        const res = await api<VerifyResponse>("/billing/dpo/verify", {
          method: "POST",
          json: {
            paymentId,
            TransactionToken: transactionToken,
            CompanyRef: companyRef,
          },
        });

        if (cancelledFetch) return;

        if (res.paid || res.data.status === "PAID") {
          setStatus("paid");
          setPropertyId(res.data.propertyId ?? null);
          await refresh();
          return;
        }

        // Fallback: ask status endpoint to re-check DPO
        const statusRes = await api<{ data: { status: string; propertyId?: string | null } }>(
          `/billing/${paymentId}/status`
        );
        if (cancelledFetch) return;
        if (statusRes.data.status === "PAID") {
          setStatus("paid");
          setPropertyId(statusRes.data.propertyId ?? null);
          await refresh();
          return;
        }

        setStatus("pending");
        setMessage(res.explanation || "Payment is still pending on DPO.");
      } catch (err) {
        if (cancelledFetch) return;
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Could not verify payment");
      }
    }

    void verify();
    return () => {
      cancelledFetch = true;
    };
  }, [cancelled, paymentId, transactionToken, companyRef, refresh]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-4 py-16">
      <div className="rounded-[1.75rem] border border-black/5 bg-white p-8 shadow-[0_20px_50px_rgba(11,28,44,0.08)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal">
          DPO payment
        </p>

        {status === "loading" ? (
          <>
            <h1 className="mt-2 font-display text-3xl text-[#0b1c2c]">Confirming payment…</h1>
            <p className="mt-2 text-sm text-ink/60">
              Please wait while we verify your MoMo/card payment with DPO Group.
            </p>
          </>
        ) : null}

        {status === "paid" ? (
          <>
            <h1 className="mt-2 font-display text-3xl text-[#0b1c2c]">Payment successful</h1>
            <p className="mt-2 text-sm text-ink/60">
              Your access is active. You can continue on Umuhuza Online.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {propertyId ? (
                <Link href={`/properties/${propertyId}`} className="btn btn-primary">
                  Back to property
                </Link>
              ) : null}
              <Link href="/dashboard" className="btn btn-secondary">
                Open dashboard
              </Link>
              <Link href="/pricing" className="text-center text-sm font-semibold text-teal">
                View pricing
              </Link>
            </div>
          </>
        ) : null}

        {status === "pending" ? (
          <>
            <h1 className="mt-2 font-display text-3xl text-[#0b1c2c]">Payment pending</h1>
            <p className="mt-2 text-sm text-ink/60">
              {message || "DPO has not marked this payment as complete yet."}
            </p>
            <button
              type="button"
              className="btn btn-primary mt-6"
              onClick={() => window.location.reload()}
            >
              Check again
            </button>
          </>
        ) : null}

        {status === "cancelled" ? (
          <>
            <h1 className="mt-2 font-display text-3xl text-[#0b1c2c]">Payment cancelled</h1>
            <p className="mt-2 text-sm text-ink/60">
              No charge was completed. You can try again anytime.
            </p>
            <Link href="/pricing" className="btn btn-primary mt-6 inline-flex">
              Back to pricing
            </Link>
          </>
        ) : null}

        {status === "error" ? (
          <>
            <h1 className="mt-2 font-display text-3xl text-[#0b1c2c]">Verification issue</h1>
            <p className="mt-2 text-sm text-orange">{message}</p>
            <Link href="/pricing" className="btn btn-primary mt-6 inline-flex">
              Back to pricing
            </Link>
          </>
        ) : null}

        {!paymentId && status !== "cancelled" ? (
          <p className="mt-4 text-sm text-orange">Missing payment reference in the return URL.</p>
        ) : null}
      </div>
    </div>
  );
}

export default function BillingReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-ink/55">
          Loading payment status…
        </div>
      }
    >
      <ReturnContent />
    </Suspense>
  );
}
