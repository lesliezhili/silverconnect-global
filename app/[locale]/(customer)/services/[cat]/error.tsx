"use client";

export default function CategoryError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center px-5 text-center">
      <h1 className="text-elder-heading font-bold text-text-primary">
        Something went wrong
      </h1>
      <p className="mt-3 text-elder-body text-text-secondary">
        We couldn&apos;t load this category. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-6 flex h-14 items-center justify-center rounded-md bg-brand px-8 text-[18px] font-bold text-white"
      >
        Try Again
      </button>
    </main>
  );
}
