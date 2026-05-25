#!/usr/bin/env node
/**
 * npm run snapshot
 *
 * Builds a versioned static snapshot of the current app into
 * public/versions/{version}/ and adds its URL to changelog.json.
 *
 * Run this AFTER `npm run version:patch` if you want the in-app
 * "view previous version" link to work. It is optional — the version
 * badge and history panel work without it.
 */

const fs           = require('fs');
const path         = require('path');
const { execSync } = require('child_process');

const ROOT      = path.resolve(__dirname, '..');
const PKG       = path.join(ROOT, 'package.json');
const JSON_LOG  = path.join(ROOT, 'src', 'data', 'changelog.json');

const pkg     = JSON.parse(fs.readFileSync(PKG, 'utf8'));
const version = pkg.version;

const snapshotBase = `/versions/${version}/`;
const snapshotTmp  = path.join(ROOT, '.snap-tmp');
const snapshotDest = path.join(ROOT, 'public', 'versions', version);

console.log(`\nBuilding snapshot for v${version}...`);

try {
  execSync(
    `npx vite build --base="${snapshotBase}" --outDir="${snapshotTmp}" --emptyOutDir`,
    { cwd: ROOT, stdio: 'inherit' }
  );
  fs.mkdirSync(path.dirname(snapshotDest), { recursive: true });
  if (fs.existsSync(snapshotDest)) fs.rmSync(snapshotDest, { recursive: true });
  fs.renameSync(snapshotTmp, snapshotDest);
  console.log(`✓ Snapshot saved to public/versions/${version}/`);
} catch (err) {
  if (fs.existsSync(snapshotTmp)) fs.rmSync(snapshotTmp, { recursive: true });
  console.error('\n✗ Snapshot build failed.');
  process.exit(1);
}

// ── Patch changelog.json to add the url for this version ─────────────
const entries = JSON.parse(fs.readFileSync(JSON_LOG, 'utf8'));
const idx = entries.findIndex(e => e.version === version);
if (idx !== -1) {
  entries[idx].url = snapshotBase;
  fs.writeFileSync(JSON_LOG, JSON.stringify(entries, null, 2) + '\n');
  console.log(`✓ changelog.json updated with snapshot URL`);
} else {
  console.warn(`⚠  v${version} not found in changelog.json — run version:patch first`);
}

console.log(`\nNext steps:`);
console.log(`  git add src/data/changelog.json public/versions/${version}`);
console.log(`  git commit -m "chore: snapshot for v${version}"`);
console.log(`  git push\n`);
