import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { pinia } from "./stores";
import { useTheme } from "./composables/useTheme";
import "./style.css";

const { initializeTheme } = useTheme();
initializeTheme();

createApp(App).use(pinia).use(router).mount("#app");
