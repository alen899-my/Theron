import { computed, ref } from "vue";

const storageKey = "router-command-theme";
const theme = ref("system");

function getSystemTheme() {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(nextTheme) {
  if (typeof document === "undefined") {
    return;
  }

  const resolvedTheme = nextTheme === "system" ? getSystemTheme() : nextTheme;
  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  document.documentElement.dataset.theme = resolvedTheme;
}

export function useTheme() {
  const resolvedTheme = computed(() =>
    theme.value === "system" ? getSystemTheme() : theme.value
  );

  function setTheme(nextTheme) {
    theme.value = nextTheme;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, nextTheme);
    }
    applyTheme(nextTheme);
  }

  function toggleTheme() {
    setTheme(resolvedTheme.value === "dark" ? "light" : "dark");
  }

  function initializeTheme() {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(storageKey);
    theme.value = stored || "system";
    applyTheme(theme.value);

    if (!window.__routerCommandThemeListener) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (theme.value === "system") {
          applyTheme("system");
        }
      });
      window.__routerCommandThemeListener = true;
    }
  }

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    initializeTheme
  };
}
