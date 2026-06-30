import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        signal: {
          bg: "#050505",
          cyan: "#5bf7ff",
          purple: "#8f5cff",
          orange: "#ff9f43",
          red: "#ff4866",
          panel: "rgba(9, 15, 20, 0.62)"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(91,247,255,0.18), 0 0 30px rgba(91,247,255,0.12), 0 0 60px rgba(143,92,255,0.08)",
        neon: "0 0 24px rgba(91,247,255,0.18)"
      },
      animation: {
        drift: "drift 10s ease-in-out infinite",
        pulseSoft: "pulseSoft 2.2s ease-in-out infinite",
        scan: "scan 7s linear infinite",
        shimmer: "shimmer 2.4s linear infinite"
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(0, -12px, 0) scale(1.02)" }
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" }
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      }
    }
  },
  plugins: []
};

export default config;
