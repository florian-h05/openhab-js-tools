# Deployment Instructions

Just run `npm run deploy` to:

- Run the `standardx` linter & apply the codestyle
- Check JS code using the TypeScript compiler
- Regenerate the type definitions
- Test the type definitions
- Test the JSDoc generation

## Publish to NPM

Use the [npm version](https://docs.npmjs.com/cli/v9/commands/npm-version) command to bump the version, commit and tag:

```shell
npm version [major | minor | patch | premajor | preminor | prepatch]
```
