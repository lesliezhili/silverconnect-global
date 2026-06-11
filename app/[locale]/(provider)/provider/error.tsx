"use client";

export default function ProviderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-[48px]">⚙️</p>
      <h1 className="mt-4 text-elder-subheading font-bold text-text-primary">
        Something went wrong
      </h1>
      <p className="mt-2 text-[17px] text-text-secondary">
        We couldn&apos;t load your provider dashboard. This usually means the database is temporarily unavailable.
      </p>
      <button
        onClick={reset}
        className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-brand px-6 text-[17px] font-bold text-white"
      >
        Try again
      </button>
    </main>
  );
}
