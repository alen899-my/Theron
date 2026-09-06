/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px"
      }
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        sidebar: "hsl(var(--sidebar))",
        "sidebar-foreground": "hsl(var(--sidebar-foreground))",
        "sidebar-border": "hsl(var(--sidebar-border))"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem"
      },
      boxShadow: {
        soft: "0 20px 60px -25px rgba(15, 23, 42, 0.24)",
        panel: "0 0 0 1px rgba(255, 255, 255, 0.04), 0 28px 50px -24px rgba(2, 6, 23, 0.42)"
      },
      fontFamily: {
        sans: ["ManropeVariable", "Manrope", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"]
      },
      backgroundImage: {
        "mesh-light":
          "radial-gradient(circle at top left, rgba(15, 23, 42, 0.06), transparent 32%), radial-gradient(circle at top right, rgba(99, 102, 241, 0.08), transparent 26%)",
        "mesh-dark":
          "radial-gradient(circle at top left, rgba(255, 255, 255, 0.08), transparent 30%), radial-gradient(circle at top right, rgba(59, 130, 246, 0.14), transparent 24%)"
      }
    }
  },
  plugins: []
};
