import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'WebMemo - Smart URL & Web Notes',
    short_name: 'WebMemo',
    description: 'Capture context-rich notes tied to every webpage and website you browse.',
    permissions: ['tabs', 'contextMenus', 'activeTab', 'scripting', 'storage'],
    action: {
      default_title: 'WebMemo',
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Alt+Shift+S',
          mac: 'MacCtrl+Shift+S',
        },
        description: 'Open WebMemo Sidepanel',
      },
      'save-selection': {
        suggested_key: {
          default: 'Ctrl+Q',
          mac: 'Command+Q',
        },
        description: 'Save selected text to WebMemo Note',
      },
    },
  },
});


