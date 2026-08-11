import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'nyang-rummikub',
 brand: {
  displayName: '냥 루미큐브',
  primaryColor: '#3182F6',
  icon: './public/favicon.ico',
},
  permissions: [],
  webBundleDir: 'dist',
});
