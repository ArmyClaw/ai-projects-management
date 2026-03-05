import { ref } from "vue";

export type ToastKind = "info" | "success" | "warning" | "error";

export type ToastItem = {
  id: number;
  kind: ToastKind;
  message: string;
};

const toastsRef = ref<ToastItem[]>([]);
let seed = 1;

export const useToast = () => toastsRef;

export const pushToast = (message: string, kind: ToastKind = "info", durationMs = 2600) => {
  const id = seed++;
  toastsRef.value = [...toastsRef.value, { id, kind, message }];
  if (durationMs > 0) {
    window.setTimeout(() => {
      toastsRef.value = toastsRef.value.filter((item) => item.id !== id);
    }, durationMs);
  }
  return id;
};

export const dismissToast = (id: number) => {
  toastsRef.value = toastsRef.value.filter((item) => item.id !== id);
};
