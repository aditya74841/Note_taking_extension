import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'URL Notes',
    description: 'Take notes on every URL you visit',
    permissions: ['tabs', 'contextMenus', 'activeTab', 'scripting', 'storage'],
    action: {},
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Alt+Shift+S',
          mac: 'MacCtrl+Shift+S',
        },
        description: 'Open URL Notes Sidepanel',
      },
      'save-selection': {
        suggested_key: {
          default: 'Ctrl+Q',
          mac: 'Command+Q',
        },
        description: 'Save selected text to URL Note',
      },
    },
  },
});


