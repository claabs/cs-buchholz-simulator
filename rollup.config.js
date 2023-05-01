import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import html from '@web/rollup-plugin-html';
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets';
import esbuild from 'rollup-plugin-esbuild';
import { generateSW } from 'rollup-plugin-workbox';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import { copy } from '@web/rollup-plugin-copy';
import path from 'path';

export default {
  input: 'index.html',
  output: {
    entryFileNames: '[hash].js',
    chunkFileNames: '[hash].js',
    assetFileNames: '[hash][extname]',
    format: 'es',
    dir: 'dist',
  },
  preserveEntrySignatures: false,

  plugins: [
    /** Enable using HTML as rollup entrypoint */
    html({
      minify: true,
      injectServiceWorker: true,
      serviceWorkerPath: 'dist/sw.js',
      absoluteBaseUrl: 'https://claabs.github.io/cs-buchholz-simulator/',
    }),
    /** Resolve bare module imports */
    nodeResolve(),
    /** Minify JS, compile JS to a lower language target */
    commonjs({
      include: [
        // the commonjs plugin is slow, list the required packages explicitly:
        '**/node_modules/color-scales/**/*',
      ],
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true,
    }),
    esbuild({
      minify: true,
      target: ['chrome64', 'firefox67', 'safari11.1'],
    }),    
    /** Bundle assets references via import.meta.url */
    importMetaAssets(),
    /** Minify html and css tagged template literals */
    babel({
      plugins: [
        [
          require.resolve('babel-plugin-template-html-minifier'),
          {
            modules: { lit: ['html', { name: 'css', encapsulation: 'style' }] },
            failOnError: false,
            strictCSS: true,
            htmlMinifier: {
              collapseWhitespace: true,
              conservativeCollapse: true,
              removeComments: true,
              caseSensitive: true,
              minifyCSS: true,
            },
          },
        ],
      ],
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
    copy({ patterns: 'assets/*' }),
  ],
};
