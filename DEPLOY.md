# Deployment Instructions

## Publish to NPM

We have a GitHub action which will publish this library automatically when a version tag is pushed.
Use the [npm version](https://docs.npmjs.com/cli/v9/commands/npm-version) command to bump the version, commit and tag:

```bash
npm run build # Perform a local build: Lint, update & test type definitions, build JSDoc
npm version [major | minor | patch] --no-git-tag-version # Select one of the commands
```

Commit and tag, then push changes and the new tag to the remote.
