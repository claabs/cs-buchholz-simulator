module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  extends: [
    "@open-wc",
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:promise/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'import/no-cycle': 'off',
    'import/extensions': ['error', 'ignorePackages' ],
    'class-methods-use-this': 'off',
  },
  ignorePatterns: ['dist/**', 'node_modules/**', '*.js', '*.cjs', '*.mjs', 'out-tsc/**'],
};
