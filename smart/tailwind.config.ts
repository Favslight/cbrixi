const { heroui } = require("@heroui/theme");
import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/pages/**/*.{ts,tsx,mdx,js,jsx}",
        "./src/components/**/*.{ts,tsx,mdx,js,jsx}",
        "./src/app/**/*.{ts,tsx,mdx,js,jsx}",
        "../../components/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./node_modules/@heroui/theme/dist/components/button.js",
        "./node_modules/@heroui/theme/dist/components/(button|snippet|code|input).js",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
            },
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                brand: {
                    blue: "#3b82f6",
                    purple: "#a855f7",
                    cyan: "#06b6d4",
                },
            },
            maxWidth: {
                "8xl": "88rem",
            },
            animation: {
                "float-slow": "floatY 6s ease-in-out infinite",
                "float-medium": "floatY 4.5s ease-in-out infinite",
                "float-fast": "floatY 3.5s ease-in-out infinite",
                "glow-pulse": "glowPulse 3s ease-in-out infinite",
                "gradient-shift": "gradientShift 12s ease infinite",
            },
            keyframes: {
                floatY: {
                    "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
                    "33%": { transform: "translateY(-14px) rotate(1.5deg)" },
                    "66%": { transform: "translateY(-7px) rotate(-1deg)" },
                },
                glowPulse: {
                    "0%, 100%": { opacity: "0.6" },
                    "50%": { opacity: "1" },
                },
                gradientShift: {
                    "0%": { backgroundPosition: "0% 50%" },
                    "50%": { backgroundPosition: "100% 50%" },
                    "100%": { backgroundPosition: "0% 50%" },
                },
            },
        },
    },
    darkMode: "class",
    plugins: [heroui()],
} satisfies Config;