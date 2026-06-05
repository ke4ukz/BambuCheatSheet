import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import yaml from '@rollup/plugin-yaml'

// Served from the root of the custom domain (bambucheatsheet.ke4ukz.com via the
// public/CNAME file), so the base is '/'. If the custom domain is ever removed
// and the app reverts to <user>.github.io/BambuCheatSheet/, set base back to
// '/BambuCheatSheet/' for production builds.
export default defineConfig({
  base: '/',
  plugins: [vue(), yaml()],
})
