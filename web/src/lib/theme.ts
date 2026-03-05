import { computed, ref } from "vue";

export type ThemeMode = "classic" | "dungeon" | "storybook" | "storybook-dusk" | "ink-shanghai" | "cyber";

const STORAGE_KEY = "app.theme";

const detectTheme = (): ThemeMode => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "classic" || saved === "dungeon" || saved === "storybook" || saved === "storybook-dusk" || saved === "ink-shanghai" || saved === "cyber") return saved;
  return "classic";
};

const themeRef = ref<ThemeMode>(detectTheme());

const applyTheme = () => {
  document.documentElement.setAttribute("data-theme", themeRef.value);
  const body = document.body;
  if (!body) return;
  body.classList.remove("theme-classic", "theme-dungeon", "theme-storybook", "theme-storybook-dusk", "theme-ink-shanghai", "theme-cyber");
  if (themeRef.value === "dungeon") body.classList.add("theme-dungeon");
  else if (themeRef.value === "storybook") body.classList.add("theme-storybook");
  else if (themeRef.value === "storybook-dusk") body.classList.add("theme-storybook-dusk");
  else if (themeRef.value === "ink-shanghai") body.classList.add("theme-ink-shanghai");
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
