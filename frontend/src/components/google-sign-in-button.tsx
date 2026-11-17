"use client";

import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useState } from "react";

export function GoogleSignInButton({
  onSuccess,
  onError,
  disabled,
}: {
  onSuccess: (idToken: string) => Promise<void> | void;
  onError?: (message: string) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <p className="rounded-xl border border-dashed border-black/10 bg-[#f8fbfb] px-3 py-2 text-xs text-ink/55">
        Google sign-in is not configured yet. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID.
      </p>
    );
  }

  async function handleCredential(response: CredentialResponse) {
    if (!response.credential) {
      onError?.("Google did not return a credential");
      return;
    }
    setBusy(true);
    try {
      await onSuccess(response.credential);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`flex w-full justify-center ${disabled || busy ? "pointer-events-none opacity-60" : ""}`}>
      <GoogleLogin
        onSuccess={(res) => {
          void handleCredential(res);
        }}
        onError={() => onError?.("Google sign-in was cancelled or failed")}
        useOneTap={false}
        theme="outline"
        size="large"
        text="continue_with"
        shape="pill"
      />
    </div>
  );
}
