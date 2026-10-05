"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/lib/auth";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      const destination =
        user.role === "ADMIN"
          ? "/admin"
          : user.role === "AGENT"
            ? next.startsWith("/dashboard")
              ? next
              : "/dashboard/listings"
            : next.startsWith("/")
              ? next
              : "/dashboard";
      router.replace(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-16">
      <BrandLogo size="lg" priority />
      <h1 className="mt-6 text-3xl font-bold text-ink">Welcome back</h1>
      <p className="mt-2 text-ink/70">Log in to save favorites and manage listings.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          Email
          <input
            className="input mt-1 rounded-xl"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            className="input mt-1 rounded-xl"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-orange">{error}</p> : null}
        <button type="submit" className="btn btn-primary w-full rounded-xl" disabled={loading}>
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>
      <div className="mt-4 rounded-xl bg-[#f5f8f9] p-3 text-xs text-ink/65">
        <p className="font-semibold text-ink/80">Demo accounts (password: password123)</p>
        <p>buyer@umuhuza.rw · claire@umuhuza.rw · admin@umuhuza.rw</p>
      </div>
      <p className="mt-6 text-sm text-ink/70">
        New here?{" "}
        <Link href="/register" className="text-teal underline-offset-2 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-16 text-ink/60">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
