/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				guide: {
					purple: '#3d2c5c',
					orange: '#e07c4a',
					beige: '#f5f0e8',
					'sand': '#e8e0d0',
					'tag': '#e8eef4',
					'tool': '#2563eb',
				},
				serif: {},
			},
			fontFamily: {
				serif: ['Georgia', 'ui-serif', 'serif'],
			},
		},
	},
	plugins: [require('@tailwindcss/typography')],
}
