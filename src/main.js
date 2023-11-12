import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

import App from "./App.vue";
import router from "./router";
import vue3GoogleLogin from "vue3-google-login";
import naive from "naive-ui";

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.config.productionTip = false;

app.use(pinia);
app.use(router);
app.use(naive);
app.use(vue3GoogleLogin, {
  clientId: "please-filled-clientId",
});
app.mount("#app");
