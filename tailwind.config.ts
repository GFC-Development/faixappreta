import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        archivo: ["var(--font-archivo)", "sans-serif"],
        hanken: ["var(--font-hanken)", "sans-serif"],
        spline: ["var(--font-spline)", "monospace"],
        teko: ["var(--font-teko)", "sans-serif"],
      },
      colors: {
        surface: {
          primary: "var(--color-bg-primary)",
          secondary: "var(--color-bg-secondary)",
          tertiary: "var(--color-bg-tertiary)",
        },
        content: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
        },
        border: "var(--color-border)",
        accent: {
          DEFAULT: "var(--color-accent)",
          light: "var(--color-accent-light)",
          dark: "var(--color-accent-dark)",
          on: "var(--color-accent-on)",
          "dark-on": "var(--color-accent-dark-on)",
        },
      },
      keyframes: {
        fpPop: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fp-pop": "fpPop 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
