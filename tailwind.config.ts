import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gaming: {
          100: "#E5DEFF", // Soft Purple
          200: "#D6BCFA", // Light Purple
          300: "#9b87f5", // Primary Purple
          400: "#8B5CF6", // Vivid Purple
          500: "#7E69AB", // Secondary Purple
          600: "#6E59A5", // Tertiary Purple
          700: "#5D4994", // Darker Purple
          800: "#4C3883", // Deep Purple
          900: "#1A1F2C", // Dark Purple
        },
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "neon-pulse": {
          "0%, 100%": {
            textShadow: "0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px var(--primary), 0 0 82px var(--primary), 0 0 92px var(--primary), 0 0 102px var(--primary), 0 0 151px var(--primary)",
          },
          "50%": {
            textShadow: "0 0 4px #fff, 0 0 7px #fff, 0 0 18px #fff, 0 0 39px var(--primary), 0 0 79px var(--primary), 0 0 89px var(--primary), 0 0 99px var(--primary), 0 0 148px var(--primary)",
          },
        },
      },
      animation: {
        "fade-in": "fade-in 0.6s ease-out",
        "slide-in": "slide-in 0.6s ease-out",
        "slide-in-right": "slide-in-right 0.6s ease-out",
        "neon-pulse": "neon-pulse 1.5s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;