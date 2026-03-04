import { computed, ref } from "vue";

export type ThemeMode = "classic" | "dungeon";

const STORAGE_KEY = "app.theme";

const detectTheme = (): ThemeMode => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "classic" || saved === "dungeon") return saved;
  return "classic";
};

const themeRef = ref<ThemeMode>(detectTheme());

const applyTheme = () => {
  document.documentElement.setAttribute("data-theme", themeRef.value);
  const body = document.body;
  if (!body) return;
  body.classList.remove("theme-classic", "theme-dungeon");
  body.classList.add(themeRef.value === "dungeon" ? "theme-dungeon" : "theme-classic");
};

export const setTheme = (next: ThemeMode) => {
  themeRef.value = next;
  localStorage.setItem(STORAGE_KEY, next);
  applyTheme();
};

export const useTheme = () => ({
  theme: computed(() => themeRef.value),
  setTheme,
});

applyTheme();
