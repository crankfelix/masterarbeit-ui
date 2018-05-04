module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint'
  },
  env: {
    browser: true,
  },
  extends: ['airbnb-base'],
  rules: {
    'no-undef': 0,
    'no-await-in-loop': 0,
    'no-unused-vars': 0,
    'no-param-reassign': 0,
    'no-restricted-globals': 0,
    'no-debugger': 0,
    'no-case-declarations': 0,
    'default-case': 0,
    'no-extend-native': 0
  }
}
