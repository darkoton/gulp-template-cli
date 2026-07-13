#!/usr/bin/env node

/**
 * gulp-template-cli
 * Usage:
 *   npx gulp-template-cli            → interactive feature picker
 *   npx gulp-template-cli tailwind   → run a specific feature directly
 *
 * Add a new feature by dropping a folder under setup/<name>/
 * with a config.js, setup.js (exporting `setup()`), and templates/.
 * No changes to this file are needed — features are discovered automatically.
 */

import { existsSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { select } from '@inquirer/prompts';

// __dirname here = location of THIS package (bin/), not the consuming project.
// We need this to discover which setup/<feature> folders ship with the package.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const setupDir = path.join(__dirname, '..', 'setup');

function listFeatures() {
  return readdirSync(setupDir).filter(name => {
    const full = path.join(setupDir, name);
    return statSync(full).isDirectory() && existsSync(path.join(full, 'setup.js'));
  });
}

async function runFeature(name) {
  const setupPath = path.join(setupDir, name, 'setup.js');

  if (!existsSync(setupPath)) {
    console.error(`\n  ✗ Unknown feature: "${name}"`);
    console.log(`  Available: ${listFeatures().join(', ')}\n`);
    process.exit(1);
  }

  const mod = await import(pathToFileURL(setupPath).href);

  if (typeof mod.setup !== 'function') {
    console.error(`\n  ✗ setup/${name}/setup.js does not export a "setup" function.\n`);
    process.exit(1);
  }

  await mod.setup();
}

async function main() {
  const featureArg = process.argv[2];

  if (featureArg) {
    await runFeature(featureArg);
    return;
  }

  const features = listFeatures();

  if (features.length === 0) {
    console.log('\n  No features found under setup/.\n');
    return;
  }

  const feature = await select({
    message: 'What do you want to add to your project?',
    choices: features.map(name => ({ name, value: name })),
  });

  await runFeature(feature);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n  ✗ Unexpected error:', err.message);
    process.exit(1);
  });