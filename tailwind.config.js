// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',        // ← app ディレクトリ
    './components/**/*.{js,ts,jsx,tsx}', // ← component ディレクトリも対象
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
