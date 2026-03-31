/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('./z-tailwind-preset.js')],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
