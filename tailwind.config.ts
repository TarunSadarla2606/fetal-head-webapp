import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0D7680',
          dark: '#0a5f67',
          light: '#11939f',
        },
      },
    },
  },
  plugins: [],
};

export default config;
