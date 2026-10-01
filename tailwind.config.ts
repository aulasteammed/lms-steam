import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: ['class'],
    content: [
		'./pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
    	extend: {
    		backgroundImage: {
    			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
    			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			},
    			'print-head': {
    				'0%, 100%': { transform: 'translateX(-1.5px)' },
    				'50%': { transform: 'translateX(1.5px)' }
    			},
    			'print-layer': {
    				'0%, 100%': { transform: 'scaleY(0.4)', opacity: '0.5' },
    				'50%': { transform: 'scaleY(1)', opacity: '1' }
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			'print-head': 'print-head 1s ease-in-out infinite',
    			'print-layer': 'print-layer 1.2s ease-in-out infinite'
    		}
    	}
    },
	plugins: [],
};
export default config;
