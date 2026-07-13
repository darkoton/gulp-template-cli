/**
 * Tailwind CSS Setup Script (CLI)
 * Run via: npx my-template-cli tailwind
 */

import fs from 'fs';
import { execSync } from 'child_process';
import * as config from './config.js';
import { resolvePath } from '../../paths.js';
import { select, confirm  } from '@inquirer/prompts';
import {
  log,
  getSourcePath,
  copyTemplate,
  safeReplace,
} from '../../helpers.js';

// ─────────────────────────────────────────────────────────────
// Setup Tasks
// ─────────────────────────────────────────────────────────────

function installPackage() {
  log(`Installing ${config.packageName}@${config.version}...`, 'info');

  try {
    execSync(`pnpm i -D ${config.packageName}@${config.version}`, {
      stdio: 'pipe',
    });
    log(`Installed ${config.packageName}@${config.version}.`, 'success');
  } catch (err) {
    log(
      `Failed to install ${config.packageName}: ${err.message}`,
      'error',
    );
    throw err;
  }
}

function createConfig(provider = 'pnpm') {
  let destPath;
  if (provider === 'pnpm') {
    destPath = resolvePath(
      config.paths.configModule.dest,
      config.files.tailwindConfig,
    );
    copyTemplate(
      config.folderName,
      config.paths.configModule.filename,
      destPath,
    );
  } else if (provider === 'cdn') {
    destPath = resolvePath(
      config.paths.configCdn.dest,
      config.files.tailwindConfig,
    );
    copyTemplate(
      config.folderName,
      config.paths.configCdn.filename,
      destPath,
    );
  } else {
    return log(`Invalid provider: ${provider}`, 'error');
  }
}

function createStyles() {
  if (!config.options.createStyles) return;

  const destPath = getSourcePath(
    config.folders.styles,
    config.files.tailwindCSS,
  );
  copyTemplate(config.folderName, config.files.tailwindCSS, destPath);
}

function injectStylesheet() {
  if (!config.options.injectStylesheet) return;

  const headPath = resolvePath(config.paths.head);

  if (!fs.existsSync(headPath)) {
    log('head.html not found.', 'error');
    return;
  }

  let content = fs.readFileSync(headPath, 'utf-8');

  if (content.includes('tailwind.css')) {
    log('Tailwind stylesheet already in head.html.', 'skip');
    return;
  }

  const link = '<link rel="stylesheet" href="./styles/tailwind.css" />';

  // Insert before the first stylesheet so Tailwind resets load first
  if (content.includes('<link rel="stylesheet"')) {
    content = content.replace(/(<link rel="stylesheet")/, `${link}\n$1`);
  } else if (content.includes('</head>')) {
    content = content.replace('</head>', `${link}\n</head>`);
  } else {
    content += `\n${link}\n`;
  }

  fs.writeFileSync(headPath, content);
  log('Added Tailwind stylesheet to head.html.', 'success');
}

function injectCdn() {
  if (!config.options.injectCdn) return;

  const headPath = resolvePath(config.paths.head);

  if (!fs.existsSync(headPath)) {
    log('head.html not found.', 'error');
    return;
  }

  let content = fs.readFileSync(headPath, 'utf-8');

  if (content.includes('cdn.tailwindcss.com')) {
    log('Tailwind CDN already in head.html.', 'skip');
    return;
  }

  const link = '<script src="https://cdn.tailwindcss.com"></script>';

  const result = safeReplace(
    content,
    /(<!-- CDN -->)/,
    `$1\n${link}`,
    'inject tailwind CDN',
  );

  if (!result.success) return;

  content = result.content;
  fs.writeFileSync(headPath, content);
  log('Added Tailwind CDN to head.html.', 'success');
}

function injectConfig() {
  if (!config.options.injectConfig) return;

  const headPath = resolvePath(config.paths.head);

  if (!fs.existsSync(headPath)) {
    log('head.html not found.', 'error');
    return;
  }

  let content = fs.readFileSync(headPath, 'utf-8');

  if (content.includes('tailwind.config.js')) {
    log('Tailwind config already in head.html.', 'skip');
    return;
  }

  const link = '<script src="./scripts/tailwind.config.js"></script>';

  const result = safeReplace(
    content,
    /(<!-- SCRIPTS -->)/,
    `$1\n${link}`,
    'inject tailwind config',
  );

  if (!result.success) return;

  content = result.content;

  fs.writeFileSync(headPath, content);
  log('Added Tailwind config to head.html.', 'success');
}

function copyDemoPage() {
  if (!config.options.copyDemoPage) return;

  const destPath = getSourcePath(
    config.folders.html,
    config.folders.pages,
    config.paths.demo.filename,
  );
  copyTemplate(config.folderName, config.files.tailwindDemo, destPath);
}

function createGulpTask() {
  const destPath = resolvePath(
    config.paths.gulpTask.dest,
    config.paths.gulpTask.filename,
  );
  copyTemplate(config.folderName, config.files.tailwindTask, destPath);
}

function updateGulpfile() {
  const gulpfilePath = resolvePath('gulpfile.js');

  if (!fs.existsSync(gulpfilePath)) {
    log('gulpfile.js not found.', 'error');
    return;
  }

  let content = fs.readFileSync(gulpfilePath, 'utf-8');

  // Check if already added
  if (content.includes("from './gulp/tasks/tailwind.js'")) {
    log('Tailwind already in gulpfile.js.', 'skip');
    return;
  }

  // Add import
  const importLine =
    "import { tailwind, tailwindReload } from './gulp/tasks/tailwind.js';";

  const resultImport = safeReplace(
    content,
    /(\/\/ Tasks plugins \(tailwind, etc\.\))/,
    `$1\n${importLine}`,
    'inject tailwind import',
  );

  if (!resultImport.success) return;

  content = resultImport.content;

  // Add to watch
  const resultWatcher = safeReplace(
    content,
    /(\/\/ Plugins watcher)/,
    `$1\n  gulp.watch(['tailwind.config.js', \`\${paths.srcStyles}/tailwind.css\`], gulp.series(tailwind, tailwindReload));`,
    'add tailwind watcher',
  );

  if (!resultWatcher.success) return;

  content = resultWatcher.content;

  // Add to mainTasks
  const resultMainTask = safeReplace(
    content,
    /(const\s+mainTasks\s*=\s*gulp\.parallel\([\s\S]*?)(\n\);)/,
    `$1\n  tailwind,$2`,
    'add tailwind to mainTasks',
  );

  if (!resultMainTask.success) return;

  content = resultMainTask.content;

  // Add to buildTasks
  const resultBuildTask = safeReplace(
    content,
    /(const\s+buildTasks\s*=\s*gulp\.parallel\([\s\S]*?)(\n\);)/,
    `$1\n  tailwind,$2`,
    'add tailwind to buildTasks',
  );

  if (!resultBuildTask.success) return;

  content = resultBuildTask.content;

  fs.writeFileSync(gulpfilePath, content);
  log('Updated gulpfile.js.', 'success');
}

function isInstalled(provider = 'pnpm') {
  let configPath;

  if (provider === 'pnpm')
    configPath = resolvePath(
      config.paths.configModule.dest,
      config.paths.configModule.filename,
    );
  else if (provider === 'cdn')
    configPath = resolvePath(
      config.paths.configCdn.dest,
      config.paths.configCdn.filename,
    );
  else {
    return log(`Invalid provider: ${provider}`, 'error');
  }

  const headPath = resolvePath(config.paths.head);

  // Check if config exists
  if (fs.existsSync(configPath)) return true;

  if (fs.existsSync(headPath)) {
    const content = fs.readFileSync(headPath, 'utf-8');
    if (content.includes('tailwind.css')) return true;
    if (content.includes('cdn.tailwindcss.com')) return true;
    if (content.includes('tailwind.config.js')) return true;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

export async function setup() {
  const provider = await select({
    message: 'Select Tailwind installation',
    choices: [
      { name: 'pnpm(npm)', value: 'pnpm' },
      { name: 'cdn', value: 'cdn' },
    ],
  });

  if (isInstalled(provider)) {
    console.log('  ⚡ Tailwind CSS is already installed.\n');
    console.log(
      `  To reinstall, remove ${config.files.tailwindConfig} and tailwind link from head.html.\n`,
    );
    return;
  }

  switch (provider) {
    case 'pnpm': {
      console.log(`\n  🎨 Tailwind CSS v${config.version} Setup (CLI)\n`);

      console.log('  This will:');
      console.log(`    • Install ${config.packageName} package`);
      console.log('    • Create tailwind.config.js');
      console.log('    • Create tailwind.css in styles folder');
      console.log('    • Add stylesheet link to head.html');
      console.log('    • Create gulp task for Tailwind CLI');
      console.log('    • Copy demo page');
      console.log('    • Auto-generate rebuild kit in dist/\n');

const confirmed = await confirm({ message: 'Do you want to continue?' });

      if (!confirmed) {
        console.log('\n  ❌ Setup cancelled.\n');
        return;
      }

      console.log('\n  Installing...\n');

      installPackage();
      createConfig(provider);
      createStyles();
      createGulpTask();
      updateGulpfile();
      injectStylesheet();
      copyDemoPage();

      console.log(`\n  ✅ Done! Docs: ${config.urls.docs}\n`);

      if (config.options.copyDemoPage) {
        console.log('  💡 Run "pnpm dev" to view the demo page.\n');
      }

      break;
    }
    case 'cdn': {
      console.log(`\n  🎨 Tailwind CSS v${config.version} Setup (CDN)\n`);

      console.log('  This will:');
      console.log('    • Create tailwind.config.js');
      console.log('    • Create tailwind.css in styles folder');
      console.log('    • Add stylesheet link to head.html');
      console.log('    • Add CDN link to head.html');
      console.log('    • Add Config link to head.html');
      console.log('    • Copy demo page \n');

      const confirmed = await confirm('Do you want to continue?');

      if (!confirmed) {
        console.log('\n  ❌ Setup cancelled.\n');
        return;
      }

      console.log('\n  Installing...\n');

      createConfig(provider);
      createStyles();
      injectStylesheet();
      injectCdn();
      injectConfig();
      copyDemoPage();

      console.log(`\n  ✅ Done! Docs: ${config.urls.docs}\n`);

      if (config.options.copyDemoPage) {
        console.log('  💡 Run "pnpm dev" to view the demo page.\n');
      }
      break;
    }
    default: {
      console.log('Invalid selection. Exiting.');
      break;
    }
  }
}
