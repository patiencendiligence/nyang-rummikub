import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'nyangrummikub',
  brand: {
    primaryColor: '#3182F6',
  },
  permissions: [],
  webBundleDir: 'dist',
  navigationBar: {
    transparentBackground: true 
  },
  webViewProps: {
    type: 'game',
  },
});
