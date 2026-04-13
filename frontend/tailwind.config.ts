import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          primary: "#0a0a0f",
          secondary: "#12121a",
          tertiary: "#1a1a26",
          hover: "#22222e",
        },
        accent: {
          primary: "#6366f1",
          hover: "#818cf8",
        },
        text: {
          primary: "#e4e4e7",
          secondary: "#a1a1aa",
          muted: "#71717a",
        },
        border: {
          DEFAULT: "#27272a",
          hover: "#3f3f46",
        },
      },
    },
  },
  plugins: [],
};

export default config;
