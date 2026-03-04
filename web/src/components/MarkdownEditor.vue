<template>
  <div class="md-editor-wrap">
    <label v-if="label">{{ label }}</label>
    <MdEditor
      :model-value="modelValue"
      :placeholder="placeholder"
      :language="locale"
      :theme="'light'"
      :toolbars="previewOnly ? previewToolbars : toolbars"
      :preview="true"
      :html-preview="true"
      :show-toolbar-name="!previewOnly"
      :no-upload-img="true"
      :read-only="readonly || previewOnly"
      :preview-only="previewOnly"
      :style="{ height: editorHeight }"
      @update:model-value="onUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { MdEditor, type ToolbarNames } from "md-editor-v3";
import { useI18n } from "../lib/i18n";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    rows?: number;
    label?: string;
    previewLabel?: string;
    readonly?: boolean;
    previewOnly?: boolean;
  }>(),
  {
    placeholder: "",
    rows: 8,
    label: "",
    previewLabel: "",
    readonly: false,
    previewOnly: false,
  }
);
const { t, locale } = useI18n();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const toolbars: ToolbarNames[] = [
  "bold",
  "underline",
  "italic",
  "strikeThrough",
  "-",
  "title",
  "sub",
  "sup",
  "quote",
  "unorderedList",
  "orderedList",
  "task",
  "-",
  "codeRow",
  "code",
  "link",
  "table",
  "emoji",
  "-",
  "revoke",
  "next",
  "save",
  "prettier",
  "preview",
  "htmlPreview",
  "catalog",
  "fullscreen",
];

const previewToolbars: ToolbarNames[] = ["preview", "htmlPreview", "catalog", "fullscreen"];

const editorHeight = computed(() => `${Math.max(props.rows * 38, 320)}px`);
const placeholder = computed(() => props.placeholder || t("md.write"));

const onUpdate = (value: string) => {
  emit("update:modelValue", value);
};
</script>

<style scoped>
.md-editor-wrap {
  width: 100%;
}

.md-editor-wrap :deep(.md-editor) {
  border-radius: 12px;
}
</style>
