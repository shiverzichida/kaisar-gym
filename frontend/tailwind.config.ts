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
        ink: {
          950: "#09090B",
          900: "#101014",
          850: "#16161C",
          800: "#1E1E26",
          700: "#2A2A35",
        },
        brand: {
          orange: "#FF6B00",
          light: "#FF8533",
          dark: "#E05A00",
        },
      },
      boxShadow: {
        orange: "0 0 24px rgba(255, 107, 0, 0.35)",
        "orange-sm": "0 0 12px rgba(255, 107, 0, 0.22)",
      },
    },
  },
  plugins: [],
};
export default config;
