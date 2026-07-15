const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette")
const plugin = require("tailwindcss/plugin")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    screens: {
      "min-420": "420px",
      "min-720": "720px",
      "min-1280": "1280px",
      "min-1536": "1536px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        display: ["var(--font-urbanist)", "Urbanist", "sans-serif"],
        cozy: ["var(--font-cozy)", "Quicksand", "sans-serif"],
        mono: ["var(--font-fira-code)", "Fira Code", "monospace"],
        arial: ["Arial", "sans-serif"],
      },
      zIndex: {
        9999: "9999",
      },
      borderColor: {
        border: "hsl(var(--border) / <alpha-value>)",
      },
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          pink: "hsl(var(--accent-pink) / <alpha-value>)",
          "pink-foreground": "hsl(var(--accent-pink-foreground) / <alpha-value>)",
          peach: "hsl(var(--accent-peach) / <alpha-value>)",
          "peach-foreground": "hsl(var(--accent-peach-foreground) / <alpha-value>)",
          blue: "hsl(var(--accent-blue) / <alpha-value>)",
          "blue-foreground": "hsl(var(--accent-blue-foreground) / <alpha-value>)",
          mint: "hsl(var(--accent-mint) / <alpha-value>)",
          "mint-foreground": "hsl(var(--accent-mint-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        chart: {
          1: "hsl(var(--chart-1) / <alpha-value>)",
          2: "hsl(var(--chart-2) / <alpha-value>)",
          3: "hsl(var(--chart-3) / <alpha-value>)",
          4: "hsl(var(--chart-4) / <alpha-value>)",
          5: "hsl(var(--chart-5) / <alpha-value>)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          primary: "hsl(var(--sidebar-primary) / <alpha-value>)",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          accent: "hsl(var(--sidebar-accent) / <alpha-value>)",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        cushion: "var(--radius)",
        "cushion-sm": "var(--radius-sm)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        base: "0 0 0 1px hsl(var(--alpha-300)), var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000)",
        soft: "var(--shadow-soft)",
        "cushion-outer": "var(--shadow-cushion-outer)",
        "cushion-inner": "var(--shadow-cushion-inner)",
        cushion: "var(--shadow-cushion)",
        "clay-sm": "var(--clay-depth-sm)",
        "clay-md": "var(--clay-depth-md)",
        "clay-lg": "var(--clay-depth-lg)",
        "clay-pressed": "var(--clay-pressed)",
      },
      keyframes: {
        "pulse-custom": {
          "0%, 100%": {
            transform: "scale(1)",
            opacity: "1",
          },
          "50%": {
            transform: "scale(1.2)",
            opacity: "0.8",
          },
        },
        "ping-slow": {
          "75%, 100%": {
            transform: "scale(1.5)",
            opacity: "0",
          },
        },
        "scale-pulse": {
          "0%, 100%": {
            transform: "scale(1)",
          },
          "50%": {
            transform: "scale(1.3)",
          },
        },
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "spin-around": {
          "0%": {
            transform: "translateZ(0) rotate(0)",
          },
          "15%, 35%": {
            transform: "translateZ(0) rotate(90deg)",
          },
          "65%, 85%": {
            transform: "translateZ(0) rotate(270deg)",
          },
          "100%": {
            transform: "translateZ(0) rotate(360deg)",
          },
        },
        "shimmer-slide": {
          to: {
            transform: "translate(calc(100cqw - 100%), 0)",
          },
        },
        "success-pulse": {
          "0%": {
            opacity: 0,
          },
          "50%": {
            opacity: 1,
          },
          "100%": {
            opacity: 0,
          },
        },
        "success-ring": {
          "0%": {
            outline: "2px solid hsl(var(--primary))",
            outlineOffset: "2px",
            opacity: "0",
          },
          "30%": {
            opacity: "1",
          },
          "100%": {
            outline: "2px solid hsl(var(--primary))",
            outlineOffset: "2px",
            opacity: "0",
          },
        },
        "copy-success": {
          "0%": {
            opacity: "0",
          },
          "15%": {
            opacity: "1",
          },
          "100%": {
            opacity: "0",
          },
        },
        "border-rotate": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-slow": "pulse-custom 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-fast":
          "pulse-custom 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 1s",
        aurora: "aurora 60s linear infinite",
        "shimmer-slide":
          "shimmer-slide var(--speed) ease-in-out infinite alternate",
        "spin-around": "spin-around calc(var(--speed) * 2) infinite linear",
        "success-ring": "success-ring 850ms ease-out forwards",
        "copy-success": "copy-success 1000ms ease-out forwards",
        "ping-slow": "ping-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scale-pulse": "scale-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "border-rotate": "border-rotate var(--duration) linear infinite",
      },
      backgroundImage: {
        "grid-white/[0.02]": `
          linear-gradient(to right, rgb(255 255 255 / 0.02) 1px, transparent 1px),
          linear-gradient(to bottom, rgb(255 255 255 / 0.02) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        grid: "30px 30px",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".scrollbar-hide": {
          /* IE and Edge */
          "-ms-overflow-style": "none",
          /* Firefox */
          "scrollbar-width": "none",
          /* Safari and Chrome */
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
      })
    }),
    addVariablesForColors,
  ],
}

// This plugin adds each Tailwind color as a global CSS variable, e.g. var(--gray-200).
function addVariablesForColors({ addBase, theme }) {
  let allColors = flattenColorPalette(theme("colors"))
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val]),
  )

  addBase({
    ":root": newVars,
  })
}
