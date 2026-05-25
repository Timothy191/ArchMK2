import { withSentryConfig } from "@sentry/nextjs";
import withPWA from "@ducanh2912/next-pwa";
import withBundleAnalyzer from "@next/bundle-analyzer";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === "true",
  },
  transpilePackages: [
    "@repo/ui",
    "@repo/supabase",
    "@repo/utils",
    "@repo/redis",
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    },
  },
};

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https?.*\/_next\/static\/.*/,
        handler: "CacheFirst",
        options: {
          cacheName: "arch-static-assets",
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /^https?.*\/api\/(?!auth).*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "arch-api-cache",
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
        },
      },
      {
        urlPattern: /^https?.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "arch-portal-cache",
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
    ],
  },
})(nextConfig);

const analyzedConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(pwaConfig);

export default withSentryConfig(analyzedConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
});
