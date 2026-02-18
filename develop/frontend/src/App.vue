<script setup lang="ts">
import { NMessageProvider, NConfigProvider } from 'naive-ui'
import { RouterView } from 'vue-router'
</script>

<template>
  <n-config-provider>
    <n-message-provider>
      <RouterView />
    </n-message-provider>
  </n-config-provider>
</template>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>
