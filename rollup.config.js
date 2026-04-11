import OMT from "@surma/rollup-plugin-off-main-thread";
import { rollupPluginHTML as html } from '@web/rollup-plugin-html';
import { copy } from '@web/rollup-plugin-copy';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import minifyHTML from '@lit-labs/rollup-plugin-minify-html-literals';
import summary from 'rollup-plugin-summary';
import replace from '@rollup/plugin-replace';
import { generateSW } from 'rollup-plugin-workbox';
import path from 'path';

export default {
  output: {
    entryFileNames: '[hash].js',
    chunkFileNames: '[hash].js',
    assetFileNames: '[hash][extname]',
    format: 'es',
    dir: 'dist',
  },

  plugins: [
    /** Enable using HTML as rollup entrypoint */
    html({
      input: 'index.html',
      minify: true,
      injectServiceWorker: true,
      serviceWorkerPath: 'dist/sw.js',
      absoluteBaseUrl: 'https://claabs.github.io/cs-buchholz-simulator/',
    }),
    // Resolve bare module specifiers to relative paths
    resolve(),
    // Minify HTML template literals
    minifyHTML(),
    // Minify JS
    terser({
      ecma: 2021,
      module: true,
      warnings: true,
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true,
    }),
    /** Handle web workers */
    OMT(),
    // Print bundle summary
    summary(),
    // Optional: copy any static assets to build directory
    copy({
      patterns: ['assets/*'],
    }),
    /** Create and inject a service worker */
    generateSW({
      globIgnores: ['polyfills/*.js', 'nomodule-*.js'],
      // where to output the generated sw
      swDest: path.join('dist', 'sw.js'),
      // directory to match patterns against to be precached
      globDirectory: path.join('dist'),
      // cache any html js and css by default
      globPatterns: ['**/*.{html,js,css,webmanifest}'],
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [{ urlPattern: 'polyfills/*.js', handler: 'CacheFirst' }],
    }),
  ],
};
