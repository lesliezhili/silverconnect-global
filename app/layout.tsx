import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSansSc = Noto_Sans_SC({
  variable: "--font-noto-sc",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "SilverConnect",
  description:
    "SilverConnect — trusted home services for older adults across AU, US, CA.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SilverConnect",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#1E293B" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: next-themes sets `data-theme` on <html> from a
    // pre-paint inline script, so the server-rendered markup intentionally
    // differs from the client's first render of this attribute.
    <html
      lang="en"
      className={`${inter.variable} ${notoSansSc.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-bg-base text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
