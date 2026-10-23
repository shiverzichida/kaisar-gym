import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          400: "#FFD285",
          500: "#FFC067",
          600: "#E5A850",
        },
        navy: {
          950: "#050A18",
          900: "#070D1E",
          850: "#0A1329",
          800: "#0F172A",
          700: "#1E293B",
        },
      },
      boxShadow: {
        gold: "0 0 24px rgba(255, 192, 103, 0.25)",
        "gold-sm": "0 0 12px rgba(255, 192, 103, 0.15)",
        emerald: "0 0 24px rgba(16, 185, 129, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
