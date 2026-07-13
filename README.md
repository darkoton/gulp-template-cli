# @darkoto/gulp-template-cli

A CLI feature installer for [gulp-template](https://github.com/darkoton/gulp-template). Instead of keeping a
`.template/` folder with setup scripts inside every cloned project,
the scripts live in a standalone package and copy the files you need
(configs, gulp tasks, styles, demo pages) directly into your project
on demand — patching `gulpfile.js` and `head.html` automatically.

## Why this exists

Normally a template's `.template/` setup folder gets copied along with
the whole repository into every new project. That causes a few problems:

- fixes/updates to the scripts have to be manually propagated to every
  project that was already started from the template;
- adding a new feature (another tool, another integration) means
  copying a folder into each project separately;
- dead setup-script code sits in the project repo forever, even after
  the feature has long been installed.

`@darkoto/gulp-template-cli` fixes this: the scripts live in one place,
versioned via npm/semver, while the project only ends up with the
**results** of running them — actual config files, styles, gulp tasks.

## Installation

```bash
npm install @darkoto/gulp-template-cli --save-dev
# or with pnpm
pnpm add -D @darkoto/gulp-template-cli
```

> Run the command from the **root of your project** — all paths
> (`src/`, `gulp/`, `gulpfile.js`, etc.) are resolved relative to
> `process.cwd()`.

## Usage

```bash
# interactive feature picker
npx template-add

# run a specific feature directly
npx template-add tailwind
```

## Available features

| Feature | What it does |
|---|---|
| `tailwind` | Installs Tailwind CSS (via a pnpm package or CDN), creates the config and stylesheet, adds a gulp task, patches `gulpfile.js` and `head.html`, and copies a demo page |

The feature list is generated automatically from the contents of the
`setup/` folder — new features show up in the CLI without any changes
to the tool itself (see [Adding a new feature](#adding-a-new-feature)).

## How it works

```
gulp-template-cli/
├── bin/
│   └── cli.js              ← entry point, discovers features automatically
├── paths.js                ← resolvePath/srcPath — resolved from the project's cwd
├── helpers.js               ← log, copyTemplate, safeReplace, etc.
├── setup-env.js             ← loads the consuming project's .env
└── setup/
    └── tailwind/
        ├── config.js        ← paths, flags, versions for this feature
        ├── setup.js         ← export async function setup() { ... }
        └── templates/       ← files that get copied into the project
```

`bin/cli.js` knows nothing about specific features — it scans `setup/*`
and picks up any folder that has a `setup.js` exporting `setup()`.

### An important note about paths

`paths.js` resolves everything from `process.cwd()`, not from the
package's own location. This is intentional: the package physically
lives in `node_modules` (or the npx cache), but it needs to operate on
files belonging to the **consuming project**, not on its own files.

The one exception is `helpers.js#copyTemplate`, which looks up template
files (`setup/<feature>/templates/*`) relative to **the package itself**
(via `import.meta.url`), since those are static assets that physically
ship inside `@darkoto/gulp-template-cli`, not inside the consumer's
project.

## Adding a new feature

1. Create `setup/<feature>/config.js`, `setup/<feature>/setup.js`, and
   `setup/<feature>/templates/`.
2. In `setup.js`, export:
   ```js
   export async function setup() {
     // ...
   }
   ```
3. Use the shared utilities via relative imports:
   ```js
   import { resolvePath } from '../../paths.js';
   import { log, copyTemplate, safeReplace } from '../../helpers.js';
   ```
4. Nothing else needs to change — `bin/cli.js` will pick up the new
   feature automatically the next time `template-add` runs.

## Requirements

- Node.js ≥ 18
- The target project must use ESM (`"type": "module"` in `package.json`)
- Expected project structure: `src/html/layouts/head.html`, a
  `gulpfile.js` with the anchor comments
  `// Tasks plugins (tailwind, etc.)`, `// Plugins watcher`, and
  `mainTasks`/`buildTasks` defined as `gulp.parallel(...)`

## Known issues (Windows + pnpm)

### `pnpm link --global` fails with `Symlink path is the same as the target path`

This is a bug in pnpm's `--global` linking mechanism on Windows, not
related to the package itself. Workaround — use the `link:` protocol
directly in the consuming project's `package.json`, bypassing the
global store entirely:

```json
{
  "devDependencies": {
    "@darkoto/gulp-template-cli": "link:../gulp-template-cli"
  }
}
```

```bash
pnpm install
```

### `WARN has no binaries` when linking

Usually means the `bin` path in `package.json` isn't resolving
correctly (make sure the path has no leading `./`, the file uses LF
line endings, and starts with the shebang `#!/usr/bin/env node` on the
very first line). Until that's sorted out, you can call the CLI
directly:

```bash
node ./node_modules/@darkoto/gulp-template-cli/bin/cli.js tailwind
```

## Development

```bash
git clone https://github.com/darkoto/gulp-template-cli.git
cd gulp-template-cli
npm install
node bin/cli.js
```

For local testing against a real project, use the `link:` approach
above instead of `npm/pnpm link --global`.

### Releasing a new version

```bash
npm version patch   # patch | minor | major
git push --tags
npm publish --access public
```

## License

MIT