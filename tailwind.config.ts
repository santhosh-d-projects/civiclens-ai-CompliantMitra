import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: { teal: { DEFAULT: "#0f766e" } }, fontFamily: { sans: ["Inter","ui-sans-serif","system-ui","sans-serif"] } } },
  plugins: [],
} satisfies Config;
