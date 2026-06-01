import { withSentryConfig } from "@sentry/nextjs";
import withPWA from "@ducanh2912/next-pwa";
import withBundleAnalyzer from "@next/bundle-analyzer";

const isProduction = process.env.NODE_ENV === "production";
const isCI = process.env.CI === "true";
// next build always sets NODE_ENV=production, so we use CI to distinguish local builds
const enableHeavyPlugins = isCI || process.env.ENABLE_HEAVY_PLUGINS === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: enableHeavyPlugins ? "standalone" : undefined,
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === "true",
  },
  transpilePackages: [
    "@repo/ui",
    "@repo/supabase",
    "@repo/utils",
    "@repo/redis",
    "@repo/theme",
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
    ],
  },
  compiler: {
    removeConsole: isProduction,
  },
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@phosphor-icons/react",
      "framer-motion",
      "@tremor/react",
      "@tabler/icons-react",
      "recharts",
    ],
  },
  turbopack: {
    resolveAlias: {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    },
  },
};

// Only generate PWA assets in CI/production — saves Workbox manifest generation time locally
const pwaConfig = enableHeavyPlugins
  ? withPWA({
      dest: "public",
      disable: false,
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
    })(nextConfig)
  : nextConfig;

const analyzedConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(pwaConfig);

// Skip Sentry source-map upload in local builds — saves ~10-15s per clean build
export default enableHeavyPlugins
  ? withSentryConfig(analyzedConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !isCI,
      dryRun: !isCI,
      widenClientFileUpload: isCI,
      tunnelRoute: "/monitoring",
      hideSourceMaps: true,
    })
  : analyzedConfig;
