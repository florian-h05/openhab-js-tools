# Deployment Instructions

# Docs

openhab-js-tools uses [JSDocs](https://jsdoc.app/) to produce API documentation.

```bash
npm run docs
```

This will output API documentation to `./docs`

This also happens automatically on every push to `main` and is published using Github Pages, see [openhab-js-tools API Documentation](https://florian-h05.github.io/openhab-js-tools/) for the latest version. 

# Types

openhab-js-tools has type definition files (`.d.ts`).

``bash
tsc
``

This will generate the type definition files.

# Publish to NPM

A CD action automatically publishes a new version to [npm](https://npmjs.com) on midnight if changes were done that day.

It is important to include special keywords in the commit message:

| Keyword(s)                                       | Code status                               | Stage         | Rule                                                                       | Example version |
|--------------------------------------------------|-------------------------------------------|---------------|----------------------------------------------------------------------------|-----------------|
| `patch`, `fixes`, `fix`, `Patch`, `Fixes`, `Fix` | Backward compatible bug fixes             | Patch release | Increment the third digit (1.0.x)                                          | 1.0.1           |
| `minor`, `new`, `add`, `Minor`, `New`, `Add`     | Backward compatible new features          | Minor release | Increment the middle digit and reset last digit to zero (1.x.0)            | 1.1.0           |
| `major`, `breaking`, `Major`, `Breaking`         | Changes that break backward compatibility | Major release | Increment the first digit and reset middle and last digits to zero (x.0.0) | 2.0.0           |

Note: Keyword are case sensitive!
