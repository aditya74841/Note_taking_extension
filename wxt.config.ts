import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'URL Notes',
    description: 'Take notes on every URL you visit',
    permissions: ['tabs'],
    action: {},
  },
});
