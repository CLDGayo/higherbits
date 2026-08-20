import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin"

const skipBuildValidation = process.env.SKIP_BUILD_VALIDATION === "true"

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  eslint: {
    // The VPS uses a constrained build path after local validation has passed.
    ignoreDuringBuilds: skipBuildValidation,
  },
  images: {
    // Explicit allowlist instead of hostname:"**" — a wildcard turns the
    // /_next/image optimizer into an open SSRF proxy for any https host.
    // NOTE: review this list against production image sources before deploy;
    // add any missing legitimate host rather than reverting to "**".
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "**.higherbits.dev" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.githubusercontent.com" },
      // GitHub profile avatars, e.g. https://github.com/shadcn.png, stored
      // as users.display_image_url. Bare github.com is NOT covered by the
      // **.githubusercontent.com entry above; next/image treats an unlisted
      // host as a hard render error, which took down the whole / shell.
      // Named per the note above: add the legitimate host, do not widen to "**".
      { protocol: "https", hostname: "github.com" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "**.clerk.accounts.dev" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "www.gravatar.com" },
      // The screenshot service behind components/ui/link-preview.tsx. Its
      // absence was not a missing image but a hard render error - next/image
      // throws "Invalid src prop ... is not configured" - so /our-story
      // crashed to Next's error page, and the a11y suite ended up auditing
      // that error overlay rather than the page. Added per the note above:
      // name the legitimate host, do not widen to "**".
      { protocol: "https", hostname: "api.microlink.io" },
    ],
  },
  reactStrictMode: true,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error"],
          }
        : false,
  },
  typescript: {
    ignoreBuildErrors: skipBuildValidation,
  },
  transpilePackages: ["ui"],
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        "**/.git/**",
        "**/node_modules/**",
        "../process/**",
        "../supabase/**",
        "../graphify-out/**",
        "./.next/**",
        "./test-results/**",
        "./test-results-shard-*/**",
      ],
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    } else {
      config.plugins = [...config.plugins, new PrismaPlugin()]
    }
    return config
  },
  async rewrites() {
    return [
      {
        source: "/r/:path*",
        destination: "/api/r/:path*",
      },
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  serverExternalPackages: ["@smithy", "util-stream"],
  async headers() {
    return [
      {
        source: "/og-image.png",
        headers: [
          {
            key: "Content-Type",
            value: "image/png",
          },
        ],
      },
    ]
  },
}

export default nextConfig
