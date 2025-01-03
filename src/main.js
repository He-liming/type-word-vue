import { createApp } from 'vue';
import App from './App.vue';
import '@/styles/reset.css'
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

const app = createApp(App);
app.use(ElementPlus);
app.mount('#app');