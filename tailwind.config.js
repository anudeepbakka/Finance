/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Bold and cheerful accent palette
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6', // teal
          600: '#0d9488',
          700: '#0f766e',
        },
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          500: '#a855f7', // purple
          600: '#9333ea',
          700: '#7c3aed',
        },
        accent: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#f97316', // coral/orange
          600: '#ea580c',
          700: '#c2410c',
        },
      },
      screens: {
        'xs': '375px',
        'iphone14plus': '428px',
      },
    },
  },
  plugins: [],
}
