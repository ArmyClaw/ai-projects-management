<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">
          <span class="eye left"></span>
          <span class="eye right"></span>
          <span class="smile"></span>
        </span>
        <span class="brand-text">Agent Team Builder</span>
      </div>
      <nav>
        <RouterLink to="/models" class="nav-link">Models</RouterLink>
        <RouterLink to="/skills" class="nav-link">Skills</RouterLink>
        <RouterLink to="/agents" class="nav-link">Agents</RouterLink>
        <RouterLink to="/bootstrap" class="nav-link">Bootstrap</RouterLink>
      </nav>
    </aside>
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  line-height: 1;
}

.brand-text {
  display: inline-block;
  transform: translateY(1px);
}

.brand-mark {
  width: 22px;
  height: 16px;
  border: 1.5px solid #2f2a39;
  border-radius: 999px;
  display: inline-block;
  position: relative;
  flex: 0 0 auto;
  background: #fff;
}

.eye {
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: #2f2a39;
  position: relative;
  top: 4px;
  display: inline-block;
}

.eye.left {
  left: 6px;
}

.eye.right {
  left: 10px;
}

.smile {
  position: absolute;
  left: 7px;
  top: 7px;
  width: 7px;
  height: 4px;
  border: 1.5px solid #2f2a39;
  border-top: 0;
  border-radius: 0 0 8px 8px;
}
</style>
