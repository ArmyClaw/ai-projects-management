<template>
  <div class="md-editor-wrap">
    <div v-if="label || canToggleMode" class="md-head">
      <label v-if="label">{{ label }}</label>
      <div v-if="canToggleMode" class="mode-switch">
        <button type="button" class="button tiny-btn" :class="{ active: mode === 'edit' }" @click="mode = 'edit'">
          {{ locale === "zh-CN" ? "编辑" : "Edit" }}
        </button>
        <button type="button" class="button tiny-btn" :class="{ active: mode === 'preview' }" @click="mode = 'preview'">
          {{ locale === "zh-CN" ? "预览" : "Preview" }}
        </button>
      </div>
    </div>
    <MdEditor
      :model-value="modelValue"
      :placeholder="placeholder"
      :language="locale"
      :theme="'light'"
      :toolbars="currentToolbars"
      :preview="false"
      :html-preview="false"
      :show-toolbar-name="!isCurrentPreviewOnly"
      :no-upload-img="true"
      :read-only="readonly || isCurrentPreviewOnly"
      :preview-only="isCurrentPreviewOnly"
      :style="{ height: editorHeight }"
      @update:model-value="onUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { MdEditor, type ToolbarNames } from "md-editor-v3";
import { useI18n } from "../lib/i18n";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    rows?: number;
    minHeight?: number;
    label?: string;
    previewLabel?: string;
    readonly?: boolean;
    previewOnly?: boolean;
  }>(),
  {
    placeholder: "",
    rows: 8,
    minHeight: 180,
    label: "",
    previewLabel: "",
    readonly: false,
    previewOnly: false,
  }
);
const { t, locale } = useI18n();
const mode = ref<"edit" | "preview">("edit");

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const editToolbars: ToolbarNames[] = [
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
const canToggleMode = computed(() => !props.previewOnly && !props.readonly);
const isCurrentPreviewOnly = computed(() => props.previewOnly || mode.value === "preview");
const currentToolbars = computed(() => (isCurrentPreviewOnly.value ? previewToolbars : editToolbars));

const editorHeight = computed(() => `${Math.max(props.rows * 34, props.minHeight)}px`);
const placeholder = computed(() => props.placeholder || t("md.write"));

watch(
  () => props.previewOnly,
  (next) => {
    if (next) mode.value = "preview";
    else if (mode.value !== "edit") mode.value = "edit";
  },
  { immediate: true },
);

const onUpdate = (value: string) => {
  emit("update:modelValue", value);
};
</script>

<style scoped>
.md-editor-wrap {
  width: 100%;
  max-width: 100%;
}

.md-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.mode-switch {
  display: flex;
  gap: 6px;
}

.tiny-btn {
  min-height: 28px;
  padding: 4px 10px;
}

.tiny-btn.active {
  background: #111;
  color: #fff;
  border-color: #111;
}

.md-editor-wrap :deep(.md-editor) {
  border-radius: 12px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.md-editor-wrap :deep(.md-editor-toolbar),
.md-editor-wrap :deep(.md-editor-content),
.md-editor-wrap :deep(.md-editor-input-wrapper) {
  max-width: 100%;
  box-sizing: border-box;
}

.md-editor-wrap :deep(.md-editor-toolbar) {
  overflow-x: auto;
  overflow-y: hidden;
}
</style>
