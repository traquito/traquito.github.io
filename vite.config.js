// https://vitejs.dev/guide/build.html
// https://vitejs.dev/guide/assets.html#the-public-directory
// https://stackoverflow.com/questions/71552229/vite-how-do-i-use-a-wildcard-in-rollupjs-build-rollupoptions-external

import { resolve } from 'path'
import { defineConfig } from 'vite'

export default {
  build: {
    sourcemap: true,
    emptyOutputDir: true,
    rollupOptions: {
        // tell vite where other resources are located that can't be found
        // by recursively navigating its default (eg main.js).
        // since we don't let it do that with index, we give it a specific
        // target to go get and manage
        input: {
            "Map": resolve(__dirname, 'public/search/spots/dashboard/Map.html'),
        },
        // when vite is munging everything together, it ensures that all js files
        // are compiled together, and nothing is left for runtime loading.
        // however, since we only want a very limited part of this site to be
        // managed, we say that the managed parts are able to dynamically load
        // javascript files that fit this pattern.
        // this pattern is -- everything basically
        external: [
            /\/js\/.*\.js/,
        ]
    },
  },
  server: {
    // disable hot module reloading (every time you save the page is auto-reloaded)
    hmr: false,
  },
}
