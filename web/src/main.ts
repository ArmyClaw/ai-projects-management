import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import "./styles.css";
import ModelsPage from "./pages/ModelsPage.vue";
import AgentsPage from "./pages/AgentsPage.vue";
import BootstrapPage from "./pages/BootstrapPage.vue";
import SkillsPage from "./pages/SkillsPage.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/models" },
    { path: "/models", component: ModelsPage },
    { path: "/skills", component: SkillsPage },
    { path: "/agents", component: AgentsPage },
    { path: "/bootstrap", component: BootstrapPage },
  ],
});

createApp(App).use(router).mount("#app");
