import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          dark: '#0a0b0e',
          card: '#12141a',
          border: '#232733',
          accent: '#38bdf8',
          subtle: '#64748b',
        },
      },
    },
  },
  plugins: [],
};

export default config;
