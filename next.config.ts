import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ali-oss's urllib dependency does a lazy `require("proxy-agent")` for
  // optional HTTP_PROXY support — proxy-agent is an optional peer dep we
  // don't install, which Turbopack's bundler treats as a hard build
  // failure rather than the runtime-only no-op it actually is. Excluding
  // ali-oss from bundling (require it directly from node_modules at
  // runtime instead) sidesteps the static analysis entirely.
  serverExternalPackages: ["ali-oss"],
};

export default withNextIntl(nextConfig);

// cache bust 20260609072933
