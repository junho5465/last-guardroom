import { defineConfig } from '@apps-in-toss/web-framework/config';
export default defineConfig({
  appName: 'last-guardroom',
  brand: { primaryColor: '#14232c' },
  permissions: [],
  webView: {
    bounces: false,
    pullToRefreshEnabled: false,
    allowsBackForwardNavigationGestures: false,
  },
  webBundleDir: 'dist',
});
