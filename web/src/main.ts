import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import "md-editor-v3/lib/style.css";
import "./styles.css";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/hall" },
    { path: "/hall", component: () => import("./pages/HallPage.vue") },
    { path: "/models", component: () => import("./pages/ModelsPage.vue") },
    { path: "/skills", component: () => import("./pages/SkillsPage.vue") },
    { path: "/mcps", component: () => import("./pages/McpsPage.vue") },
    { path: "/agents", component: () => import("./pages/AgentsPage.vue") },
    { path: "/bootstrap", component: () => import("./pages/BootstrapPage.vue") },
    { path: "/tasks", component: () => import("./pages/TasksPage.vue") },
  ],
});

createApp(App).use(router).mount("#app");
