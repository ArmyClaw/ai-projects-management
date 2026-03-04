<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-top">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true">
            <span class="eye left"></span>
            <span class="eye right"></span>
            <span class="smile"></span>
          </span>
          <span class="brand-text">Agent Team Builder</span>
        </div>
        <nav>
          <RouterLink to="/hall" class="nav-link">{{ t("nav.hall") }}</RouterLink>
          <RouterLink to="/models" class="nav-link">{{ t("nav.models") }}</RouterLink>
          <RouterLink to="/skills" class="nav-link">{{ t("nav.skills") }}</RouterLink>
          <RouterLink to="/mcps" class="nav-link">{{ t("nav.mcps") }}</RouterLink>
          <RouterLink to="/agents" class="nav-link">{{ t("nav.agents") }}</RouterLink>
          <RouterLink to="/bootstrap" class="nav-link">{{ t("nav.bootstrap") }}</RouterLink>
          <RouterLink to="/tasks" class="nav-link">{{ t("nav.tasks") }}</RouterLink>
        </nav>
      </div>
      <div class="sidebar-bottom">
        <button v-if="isLoggedIn && user" type="button" class="host-entry" @click="profileOpen = true">
          <img :src="user.avatar || defaultAvatar" alt="host avatar" class="host-avatar" />
          <span class="host-name">{{ user.displayName }}</span>
          <small class="host-handle">@{{ user.handle }}</small>
        </button>
        <button v-else type="button" class="host-login-btn" @click="authOpen = true">
          {{ locale === "zh-CN" ? "注册 / 登录主理人" : "Register / Login Host" }}
        </button>
        <label class="locale-label" for="locale-select">{{ locale === "zh-CN" ? "语言" : "Language" }}</label>
        <select id="locale-select" class="locale-select" :value="locale" @change="onLocaleChange">
          <option value="zh-CN">{{ t("lang.zh") }}</option>
          <option value="en-US">{{ t("lang.en") }}</option>
        </select>
        <label class="locale-label" for="theme-select">{{ t("theme.label") }}</label>
        <select id="theme-select" class="locale-select" :value="theme" @change="onThemeChange">
          <option value="classic">{{ t("theme.classic") }}</option>
          <option value="dungeon">{{ t("theme.dungeon") }}</option>
        </select>
      </div>
    </aside>

    <main class="main">
      <div v-if="apiNetworkErrorBase" class="global-network-banner">
        <strong>{{ locale === "zh-CN" ? "后端连接异常" : "Backend Connection Issue" }}</strong>
        <span>
          {{
            locale === "zh-CN"
              ? `无法连接后端，请确认服务已启动。最后尝试: ${apiNetworkErrorBase}`
              : `Cannot reach backend service. Last tried: ${apiNetworkErrorBase}`
          }}
        </span>
        <button type="button" class="banner-close" @click="clearApiNetworkErrorBase()">
          {{ locale === "zh-CN" ? "关闭" : "Dismiss" }}
        </button>
      </div>
      <RouterView />
    </main>

    <div v-if="authOpen" class="modal-backdrop" @click.self="closeAuthModal">
      <div class="modal-panel auth-panel">
        <div class="auth-layout">
          <aside class="auth-side">
            <div class="orb"></div>
            <h3>{{ locale === "zh-CN" ? "世界主理人入口" : "World Host Gate" }}</h3>
            <p class="muted">{{ locale === "zh-CN" ? "创建你的身份卡，管理所有配置并留下创建轨迹。" : "Create your host identity card and own every configuration trail." }}</p>
            <div class="host-card">
              <img :src="registerForm.avatar || user?.avatar || defaultAvatar" alt="host preview avatar" class="host-avatar large" />
              <strong>{{ registerForm.displayName || user?.displayName || (locale === "zh-CN" ? "未命名主理人" : "Unnamed Host") }}</strong>
              <small>@{{ registerForm.handle || user?.handle || "world_host" }}</small>
            </div>
          </aside>

          <div class="auth-main">
            <div class="auth-tabs">
              <button type="button" class="auth-tab" :class="{ active: authMode === 'login' }" @click="authMode = 'login'">{{ locale === "zh-CN" ? "登录" : "Login" }}</button>
              <button type="button" class="auth-tab" :class="{ active: authMode === 'register' }" @click="authMode = 'register'">{{ locale === "zh-CN" ? "注册" : "Register" }}</button>
            </div>

            <div v-if="authMode === 'register'" class="auth-form">
              <label>{{ locale === "zh-CN" ? "账号 Handle" : "Handle" }}</label>
              <input v-model.trim="registerForm.handle" class="input" placeholder="world_host" />
              <label>{{ locale === "zh-CN" ? "昵称" : "Display Name" }}</label>
              <input v-model.trim="registerForm.displayName" class="input" placeholder="World Commander" />
              <label>{{ locale === "zh-CN" ? "密码" : "Password" }}</label>
              <input v-model="registerForm.password" type="password" class="input" />
              <div class="avatar-upload">
                <input ref="avatarInputRef" type="file" class="hidden-input" accept="image/*" @change="onPickAvatar" />
                <button type="button" class="button" @click="pickAvatar">{{ locale === "zh-CN" ? "上传头像" : "Upload Avatar" }}</button>
                <span class="muted">{{ locale === "zh-CN" ? "支持 png / jpg" : "supports png / jpg" }}</span>
              </div>
              <p v-if="authError" class="error-text">{{ authError }}</p>
              <div class="auth-actions">
                <button type="button" class="button" @click="closeAuthModal">{{ t("common.cancel") }}</button>
                <button type="button" class="button primary" @click="submitRegister">{{ locale === "zh-CN" ? "注册并进入" : "Register & Enter" }}</button>
              </div>
            </div>

            <div v-else class="auth-form">
              <label>{{ locale === "zh-CN" ? "账号 Handle" : "Handle" }}</label>
              <input v-model.trim="loginForm.handle" class="input" placeholder="world_host" />
              <label>{{ locale === "zh-CN" ? "密码" : "Password" }}</label>
              <input v-model="loginForm.password" type="password" class="input" />
              <p v-if="authError" class="error-text">{{ authError }}</p>
              <div class="auth-actions">
                <button type="button" class="button" @click="closeAuthModal">{{ t("common.cancel") }}</button>
                <button type="button" class="button primary" @click="submitLogin">{{ locale === "zh-CN" ? "登录进入" : "Login" }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="profileOpen && user" class="modal-backdrop" @click.self="profileOpen = false">
      <div class="modal-panel profile-panel">
        <img :src="user.avatar || defaultAvatar" alt="host avatar" class="host-avatar large" />
        <h3>{{ user.displayName }}</h3>
        <p class="muted">@{{ user.handle }}</p>
        <p class="muted">{{ locale === "zh-CN" ? "你是当前世界主理人，所有配置写入会记录你的身份。" : "You are the current world host. All config writes are attributed to you." }}</p>
        <div class="auth-actions">
          <button type="button" class="button" @click="profileOpen = false">{{ t("common.close") }}</button>
          <button type="button" class="button primary" @click="doLogout">{{ locale === "zh-CN" ? "退出登录" : "Logout" }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import type { Locale } from "./lib/i18n";
import { useI18n } from "./lib/i18n";
import { useAuth } from "./lib/auth";
import { NETWORK_ERROR_CODE } from "./lib/api-base";
import { apiNetworkErrorBase, clearApiNetworkErrorBase } from "./lib/network-status";
import type { ThemeMode } from "./lib/theme";
import { useTheme } from "./lib/theme";

const { t, locale, setLocale } = useI18n();
const { theme, setTheme } = useTheme();
const { user, isLoggedIn, login, register, logout, refresh } = useAuth();

const defaultAvatar =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>
      <rect width='120' height='120' fill='white'/>
      <circle cx='60' cy='38' r='22' fill='white' stroke='black' stroke-width='3'/>
      <circle cx='52' cy='36' r='3' fill='black'/>
      <circle cx='68' cy='36' r='3' fill='black'/>
      <path d='M50 48 Q60 56 70 48' fill='none' stroke='black' stroke-width='3' stroke-linecap='round'/>
      <rect x='30' y='66' width='60' height='38' rx='12' fill='white' stroke='black' stroke-width='3'/>
    </svg>`,
  );

const authOpen = ref(false);
const profileOpen = ref(false);
const authMode = ref<"login" | "register">("login");
const authError = ref("");
const avatarInputRef = ref<HTMLInputElement | null>(null);

const loginForm = reactive({
  handle: "",
  password: "",
});

const registerForm = reactive({
  handle: "",
  displayName: "",
  password: "",
  avatar: "",
});

const onLocaleChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value as Locale;
  if (value === "zh-CN" || value === "en-US") setLocale(value);
};

const onThemeChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value as ThemeMode;
  if (value === "classic" || value === "dungeon") setTheme(value);
};

const closeAuthModal = () => {
  authOpen.value = false;
  authError.value = "";
};

const pickAvatar = () => {
  avatarInputRef.value?.click();
};

const onPickAvatar = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") registerForm.avatar = reader.result;
  };
  reader.readAsDataURL(file);
  input.value = "";
};

const submitRegister = async () => {
  authError.value = "";
  try {
    await register({
      handle: registerForm.handle,
      displayName: registerForm.displayName,
      password: registerForm.password,
      avatar: registerForm.avatar || undefined,
    });
    closeAuthModal();
  } catch (error) {
    authError.value = mapAuthError(error);
  }
};

const submitLogin = async () => {
  authError.value = "";
  try {
    await login({ handle: loginForm.handle, password: loginForm.password });
    closeAuthModal();
  } catch (error) {
    authError.value = mapAuthError(error);
  }
};

const doLogout = async () => {
  await logout();
  profileOpen.value = false;
};

const mapAuthError = (error: unknown) => {
  const text = String(error ?? "");
  if (text.includes(NETWORK_ERROR_CODE)) {
    return locale.value === "zh-CN"
      ? "无法连接后端服务，请确认 backend 已启动（默认: http://localhost:4000）。"
      : "Cannot reach backend. Please ensure backend is running (default: http://localhost:4000).";
  }
  if (text.includes("UNAUTHORIZED")) {
    return locale.value === "zh-CN" ? "账号或密码不正确。" : "Invalid handle or password.";
  }
  if (text.includes("CONFLICT")) {
    return locale.value === "zh-CN" ? "该 Handle 已被使用。" : "This handle is already taken.";
  }
  return text;
};

onMounted(async () => {
  clearApiNetworkErrorBase();
  await refresh();
});
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
  z-index: 10;
}

.sidebar-top {
  display: grid;
  gap: 10px;
}

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

.sidebar-bottom {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px;
  display: grid;
  gap: 8px;
  position: fixed;
  left: 12px;
  bottom: 12px;
  width: min(204px, calc(100vw - 24px));
  background: var(--surface);
  box-shadow: 0 6px 22px rgba(20, 20, 20, 0.12);
  z-index: 1200;
  pointer-events: auto;
}

.sidebar-bottom * {
  pointer-events: auto !important;
}

.locale-label {
  margin: 0;
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 700;
}

.locale-select {
  width: 100%;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 700;
  padding: 0 10px;
}

.host-entry {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px 10px 4px 4px;
  background: var(--surface-soft);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.host-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--border);
  object-fit: cover;
  background: var(--surface);
}

.host-avatar.large {
  width: 88px;
  height: 88px;
  border-width: 2px;
}

.host-name {
  font-weight: 800;
  font-size: 13px;
}

.host-handle {
  color: #656565;
  font-size: 11px;
}

.host-login-btn {
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--text-primary);
  padding: 8px 12px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}

.global-network-banner {
  position: sticky;
  top: 8px;
  z-index: 1200;
  margin-bottom: 8px;
  border: 1px solid #111;
  border-radius: 10px;
  padding: 8px 10px;
  background: #fff;
  display: grid;
  gap: 2px;
}

.global-network-banner strong {
  font-size: 12px;
}

.global-network-banner span {
  font-size: 12px;
  color: #444;
  word-break: break-all;
}

.banner-close {
  justify-self: end;
  border: 1px solid #d0d0d0;
  border-radius: 999px;
  background: #fff;
  padding: 3px 10px;
  font-size: 11px;
  cursor: pointer;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(16, 16, 16, 0.48);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
  padding: 16px;
}

.modal-panel {
  width: min(760px, 100%);
  max-height: calc(100vh - 32px);
  overflow: auto;
  border: 1px solid #171717;
  border-radius: 14px;
  background: #fff;
  padding: 14px;
}

.auth-panel {
  background:
    radial-gradient(circle at 12px 12px, #0f0f0f 1px, transparent 1px) 0 0 / 14px 14px,
    linear-gradient(180deg, #fff 0%, #f8f8f8 100%);
}

.auth-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 12px;
}

.auth-side {
  border: 1px solid #202020;
  border-radius: 12px;
  padding: 10px;
  background:
    repeating-linear-gradient(45deg, #fff, #fff 10px, #f7f7f7 10px, #f7f7f7 20px);
  text-align: center;
}

.auth-side h3 {
  margin: 4px 0;
}

.auth-side p {
  margin: 0;
}

.host-card {
  margin-top: 10px;
  border: 1px dashed #2b2b2b;
  border-radius: 12px;
  background: #fff;
  padding: 10px;
  display: grid;
  gap: 4px;
  justify-items: center;
}

.host-card strong,
.host-card small {
  display: block;
}

.orb {
  width: 22px;
  height: 22px;
  border: 2px solid #111;
  border-radius: 50%;
  margin: 0 auto 6px;
}

.auth-main {
  border: 1px solid #222;
  border-radius: 12px;
  padding: 10px;
  background: #fff;
}

.auth-tabs {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.auth-tab {
  border: 1px solid #1e1e1e;
  background: #fff;
  border-radius: 10px;
  height: 34px;
  font-weight: 700;
  cursor: pointer;
}

.auth-tab.active {
  background: #111;
  color: #fff;
}

.auth-form {
  margin-top: 10px;
  display: grid;
  gap: 8px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 10px;
}

.auth-form label {
  margin: 0;
}

.auth-form .input {
  min-height: 38px;
}

.avatar-upload {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  border: 1px dashed #d8d8d8;
  border-radius: 10px;
  padding: 8px;
}

.avatar-upload .button {
  max-width: none;
}

.hidden-input {
  display: none;
}

.profile-panel {
  text-align: center;
  display: grid;
  gap: 6px;
}

.profile-panel h3,
.profile-panel p {
  margin: 0;
}

.auth-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.auth-actions .button {
  max-width: none;
}

@media (max-width: 900px) {
  .sidebar-bottom {
    left: 8px;
    bottom: 8px;
    width: min(220px, calc(100vw - 16px));
  }

  .auth-layout {
    grid-template-columns: 1fr;
  }

  .avatar-upload {
    flex-wrap: wrap;
  }

  .host-entry {
    max-width: 100%;
  }
}
</style>
