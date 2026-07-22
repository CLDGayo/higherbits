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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
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
