module.exports = {
  root: true,
  // This tells ESLint to load the config from the package `eslint-config-custom`
  extends: ['custom'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./apps/*/tsconfig.json', './packages/*/tsconfig.json'],
  },
}
