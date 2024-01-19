const standard = require('eslint-config-standard')

module.exports = {
  ...standard,
  rules: {
    semi: ["error", "always"],
    "no-extra-semi": "error",
    "func-style": ["error", "declaration", { "allowArrowFunctions": true }]
  },
  globals: {
    Java: "readonly"
  }
}
