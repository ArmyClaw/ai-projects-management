import { ref } from "vue";

export const apiNetworkErrorBase = ref("");
let clearTimer: ReturnType<typeof setTimeout> | null = null;

export const setApiNetworkErrorBase = (base: string) => {
  apiNetworkErrorBase.value = base;
  if (clearTimer) clearTimeout(clearTimer);
  clearTimer = setTimeout(() => {
    apiNetworkErrorBase.value = "";
    clearTimer = null;
  }, 8000);
};

export const clearApiNetworkErrorBase = () => {
  apiNetworkErrorBase.value = "";
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }
};
