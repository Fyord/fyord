# Fyord

[![CI](https://github.com/Fyord/fyord/actions/workflows/ci.yml/badge.svg)](https://github.com/Fyord/fyord/actions/workflows/ci.yml)
![Code Coverage](https://img.shields.io/badge/Code%20Coverage-100%25-success?style=flat)
![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/Fyord/fyord.svg?logo=lgtm&logoWidth=18)

Fyord is a light-weight framework designed to embrace core competencies.

It's designed to take advantage of everything you love about web development without the need to learn a considerable amount of new framework-specific knowledge, letting you focus your time on skills that transfer.

We're building Fyord to be easy to test and debug. It's fast and secure by default. It's also minimal in learning curve, boilerplate, and friction.

Try it and let us know what you think!

## Quick start
Ensure you have [npm/node](https://nodejs.org/en/) installed, and run these commands in your terminal:
```
npx fyord-cli new NewFyordApp
cd NewFyordApp
npm i
npm start
```

---

## Contributors

[Code of conduct](https://github.com/Fyord/fyord/blob/main/CODE_OF_CONDUCT.md)

### Installation
- `npm i`

### Test
- `npm test`

### Lint
- `npm run lint`

### Build (with source maps)
- `npm run build`

### Publish to npm (manually)
- Update `./dist/package.json` version*.
- `npm login`
- `npm run build-prod`
- `npm run publish`

### Publish to npm (CI)
- Update `./dist/package.json` version*.
- Merge changes to trunk (main) branch.
  - Assuming the build passes and the version in the `./dist/package.json` has been updated, CI will publish the new version.

*Use Semantic Versioning (MAJOR.MINOR.PATCH - 1.1.1)
- MAJOR version when you make incompatible API changes
- MINOR version when you add functionality in a backwards compatible manner
- PATCH version when you make backwards compatible bug fixes.

Consider anything importable via `fyord` directly as part of the public api (exports of `src/module.ts`);
