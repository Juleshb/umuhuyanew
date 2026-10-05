"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/lib/auth";

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"BUYER" | "AGENT">("BUYER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("role") === "AGENT") {
      setRole("AGENT");
    }
  }, [searchParams]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await register({ name, email, phone: phone || undefined, password, role });
      router.push(user.role === "AGENT" ? "/dashboard/listings" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-16">
      <BrandLogo size="lg" priority />
      <h1 className="mt-6 text-3xl font-bold text-ink">Join Umuhuza Online</h1>
      <p className="mt-2 text-ink/70">Create an account as a buyer/renter or an agent.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          Full name
          <input
            className="input mt-1 rounded-xl"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Email
          <input
            className="input mt-1 rounded-xl"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Phone
          <input
            className="input mt-1 rounded-xl"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+250…"
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            className="input mt-1 rounded-xl"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <fieldset className="space-y-2 text-sm">
          <legend>I am joining as</legend>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="role"
              checked={role === "BUYER"}
              onChange={() => setRole("BUYER")}
            />
            Buyer / renter
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="role"
              checked={role === "AGENT"}
              onChange={() => setRole("AGENT")}
            />
            Agent (list properties)
          </label>
        </fieldset>
        {error ? <p className="text-sm text-orange">{error}</p> : null}
        <button type="submit" className="btn btn-primary w-full rounded-xl" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
        <p className="text-xs leading-relaxed text-ink/55">
          By creating an account you agree to the{" "}
          <Link href="/terms" className="text-teal hover:underline">
            Terms and Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-teal hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
      <p className="mt-6 text-sm text-ink/70">
        Already have an account?{" "}
        <Link href="/login" className="text-teal underline-offset-2 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="p-16 text-ink/60">Loading…</p>}>
      <RegisterForm />
    </Suspense>
  );
}
