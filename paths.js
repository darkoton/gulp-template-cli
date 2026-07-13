/**
 * Template Paths
 * Utilities for setup scripts in setup/*
 *
 * IMPORTANT: rootDir = process.cwd(), NOT __dirname.
 * This package can live in node_modules or npx cache —
 * paths must resolve relative to the CONSUMING project,
 * not to where this package physically sits.
 * Run the CLI from the project root.
 */

import path from 'path';

const rootDir = process.cwd();

// Directory names (mirrors gulp/configs/paths.js in the target project)
const folders = {
  src: 'src',
  styles: 'styles',
  scripts: 'scripts',
  html: 'html',
  layouts: 'layouts',
  pages: 'pages',
  components: 'components',
};

// ─────────────────────────────────────────────────────────────
// Path Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Path relative to project root (cwd)
 */
export const resolvePath = (...parts) => path.join(rootDir, ...parts);

/**
 * Path to source files
 */
export const srcPath = (...parts) => resolvePath(folders.src, ...parts);

/**
 * Path to gulp tasks
 */
export const gulpPath = (...parts) => resolvePath('gulp', ...parts);

// ─────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────

export const templatePaths = {
  root: rootDir,

  // Computed paths
  src: srcPath(),
  srcStyles: srcPath(folders.styles),
  srcScripts: srcPath(folders.scripts),
  srcHtml: srcPath(folders.html),
  srcHtmlLayouts: srcPath(folders.html, folders.layouts),
  srcHtmlPages: srcPath(folders.html, folders.pages),
  srcHtmlComponents: srcPath(folders.html, folders.components),

  // Gulp
  gulpTasks: gulpPath('tasks'),
  gulpConfigs: gulpPath('configs'),
  gulpUtils: gulpPath('utils'),

  // Helpers
  resolvePath,
  srcPath,
  gulpPath,
};
