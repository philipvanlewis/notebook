import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Design System Colors - Using CSS variables for OKLCH support
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Semantic colors
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        // Graph visualization colors
        graph: {
          node: "hsl(var(--graph-node))",
          edge: "hsl(var(--graph-edge))",
          highlight: "hsl(var(--graph-highlight))",
        },
      },
      // Typography - Major Third Scale (1.25)
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      fontSize: {
        xs: ["0.64rem", { lineHeight: "1.5" }],      // 10.24px
        sm: ["0.8rem", { lineHeight: "1.5" }],       // 12.8px
        base: ["1rem", { lineHeight: "1.6" }],       // 16px
        lg: ["1.25rem", { lineHeight: "1.5" }],      // 20px
        xl: ["1.563rem", { lineHeight: "1.4" }],     // 25px
        "2xl": ["1.953rem", { lineHeight: "1.3" }],  // 31.25px
        "3xl": ["2.441rem", { lineHeight: "1.2" }],  // 39.06px
        "4xl": ["3.052rem", { lineHeight: "1.1" }],  // 48.83px
      },
      // Spacing - 4px base unit
      spacing: {
        "4.5": "1.125rem", // 18px
        "13": "3.25rem",   // 52px
        "15": "3.75rem",   // 60px
        "17": "4.25rem",   // 68px
        "18": "4.5rem",    // 72px
        "19": "4.75rem",   // 76px
        "21": "5.25rem",   // 84px
        "22": "5.5rem",    // 88px
        "88": "22rem",     // 352px - sidebar width
        "128": "32rem",    // 512px
      },
      // Border radius
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Animations
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in-from-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-to-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.15s ease-out",
        "fade-out": "fade-out 0.15s ease-out",
        "slide-in": "slide-in-from-right 0.2s ease-out",
        "slide-out": "slide-out-to-right 0.2s ease-out",
        "scale-in": "scale-in 0.15s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      // Transitions
      transitionDuration: {
        fast: "100ms",
        normal: "200ms",
        slow: "300ms",
      },
      // Box shadows
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        focus: "0 0 0 3px hsl(var(--ring) / 0.2)",
      },
      // Z-index scale
      zIndex: {
        dropdown: "1000",
        sticky: "1100",
        fixed: "1200",
        overlay: "1300",
        modal: "1400",
        popover: "1500",
        tooltip: "1600",
        toast: "1700",
        "command-palette": "1800",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
