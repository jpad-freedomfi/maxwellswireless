/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#BFB38A',
        accent: '#D4882A',
        background: '#FDFBF7',
        foreground: '#1a1a2e',
        secondary: '#4A3728',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        content: '1200px',
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.foreground'),
            '--tw-prose-headings': theme('colors.secondary'),
            '--tw-prose-links': theme('colors.accent'),
            maxWidth: '75ch',
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
