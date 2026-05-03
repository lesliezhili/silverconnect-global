import * as React from "react";
import { Wrench } from "lucide-react";

/**
 * Shared body for profile sub-pages whose dedicated screens land in
 * later sprints (#19-#27 per UI_PAGES.md). Renders a friendly
 * "coming soon" card so the routes are reachable and the navigation
 * doesn't dead-end.
 */
export function ProfileStub({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-content flex-col items-center justify-center gap-3 px-5 pb-[120px] pt-12 text-center sm:pb-12"
    >
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Wrench size={40} aria-hidden />
      </span>
      <h1 className="text-h2">{title}</h1>
      <p className="max-w-[320px] text-[15px] text-text-secondary">{hint}</p>
    </main>
  );
}
