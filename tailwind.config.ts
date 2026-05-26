import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#1e40af",
          600: "#1d3a8a",
          700: "#172554",
          900: "#0b1437",
        },
        gold: {
          400: "#f5c542",
          500: "#d4a017",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        tamil: ["Noto Sans Tamil", "system-ui", "sans-serif"],
        sinhala: ["Noto Sans Sinhala", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
