import { computed, ref } from "vue";

export type ThemeMode = "classic" | "dungeon" | "storybook" | "cyber";

const STORAGE_KEY = "app.theme";

const detectTheme = (): ThemeMode => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "classic" || saved === "dungeon" || saved === "storybook" || saved === "cyber") return saved;
  return "classic";
};

const themeRef = ref<ThemeMode>(detectTheme());

const applyTheme = () => {
  document.documentElement.setAttribute("data-theme", themeRef.value);
  const body = document.body;
  if (!body) return;
  body.classList.remove("theme-classic", "theme-dungeon", "theme-storybook", "theme-cyber");
  if (themeRef.value === "dungeon") body.classList.add("theme-dungeon");
  else if (themeRef.value === "storybook") body.classList.add("theme-storybook");
  else if (themeRef.value === "cyber") body.classList.add("theme-cyber");
  else body.classList.add("theme-classic");
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
