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
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "**.clerk.accounts.dev" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "www.gravatar.com" },
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
