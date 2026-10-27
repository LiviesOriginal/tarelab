/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "hsl(var(--ink))", navy: "hsl(var(--primary))", gold: "hsl(var(--gold))" }, fontFamily: { sans: ["Inter", "sans-serif"], display: ["Cormorant Garamond", "Georgia", "serif"], mono: ["JetBrains Mono", "monospace"] } } },
  plugins: []
};