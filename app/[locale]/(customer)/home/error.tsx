
"use client";

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center px-5 text-center">
      <h1 className="text-elder-heading font-bold text-gray-900">
        Something went wrong
      </h1>
      <p className="mt-3 text-elder-body text-gray-600">
        We couldn&apos;t load the page. This usually means the database isn&apos;t connected.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-2xl bg-blue-600 px-8 py-4 text-elder-body font-bold text-white"
        style={{ minHeight: "56px" }}
      >
        Try Again
      </button>
    </main>
  );
}
