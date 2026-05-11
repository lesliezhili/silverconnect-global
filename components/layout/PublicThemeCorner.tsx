import { ThemeToggle } from "./ThemeToggle";

/**
 * Fixed top-right ThemeToggle for pages that render no header/shell — the 5
 * public auth pages and the admin login page. Sits above page content; auth
 * layouts should give their content enough top padding that the button never
 * overlaps a title / back link / form field.
 */
export function PublicThemeCorner() {
  return (
    <div className="fixed right-4 top-4 z-50">
      <ThemeToggle />
    </div>
  );
}
