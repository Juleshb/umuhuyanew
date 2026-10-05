export default function OfflinePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0b1c2c] px-6 text-center text-white">
      <p className="text-sm uppercase tracking-[0.2em] text-teal">Umuhuza Online</p>
      <h1 className="mt-3 text-3xl font-bold">You are offline</h1>
      <p className="mt-3 max-w-sm text-white/70">
        Check your connection and try again. Previously viewed pages may still be available.
      </p>
      <a href="/" className="btn mt-8 rounded-2xl bg-orange px-6 py-3 font-bold text-white">
        Retry
      </a>
    </div>
  );
}
