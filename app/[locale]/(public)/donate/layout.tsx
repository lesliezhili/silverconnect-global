/**
 * Donate route layout — forces light theme for the marketing pages.
 *
 * The donate landing's color palette is locked (Tailwind tokens + a few
 * one-off brand colors); a dark-mode pass is out of scope for this round.
 * We can't toggle <html data-theme> from a page (only `app/layout.tsx`
 * renders <html>), so the wrapper applies it on the inner div instead.
 */
export default function DonateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="light" className="bg-bg-base text-text-primary">
      {children}
    </div>
  );
}
