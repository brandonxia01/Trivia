/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", // <-- scan your app folder
    "./pages/**/*.{js,ts,jsx,tsx}", // optional
    "./components/**/*.{js,ts,jsx,tsx}", // optional
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
