#!/usr/bin/env node
/**
 * Usage: node scripts/bump-version.js [patch|minor|major]
 * - Reads [Unreleased] section from CHANGELOG.md
 * - Creates a new versioned entry
 * - Clears [Unreleased] and resets it with blank sections
 * - Bumps version in package.json
 * - Syncs src/data/changelog.json for the dashboard
 * - Builds a versioned snapshot into public/versions/{version}/ for in-app preview
 */

const fs            = require('fs');
const path          = require('path');
const { execSync }  = require('child_process');

const ROOT      = path.resolve(__dirname, '..');
const CHANGELOG = path.join(ROOT, 'CHANGELOG.md');
const PKG       = path.join(ROOT, 'package.json');
const JSON_LOG  = path.join(ROOT, 'src', 'data', 'changelog.json');

const bumpType = process.argv[2] || 'patch';
if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('Usage: node scripts/bump-version.js [patch|minor|major]');
  process.exit(1);
}

// ── Read files ────────────────────────────────────────────────────────
const changelog = fs.readFileSync(CHANGELOG, 'utf8');
const pkg       = JSON.parse(fs.readFileSync(PKG, 'utf8'));

// ── Bump semver ───────────────────────────────────────────────────────
const [major, minor, patch] = pkg.version.split('.').map(Number);
let newVersion;
if (bumpType === 'major') newVersion = `${major + 1}.0.0`;
else if (bumpType === 'minor') newVersion = `${major}.${minor + 1}.0`;
else newVersion = `${major}.${minor}.${patch + 1}`;

const today = new Date().toISOString().slice(0, 10);

// ── Extract [Unreleased] content ──────────────────────────────────────
const unreleasedMatch = changelog.match(/## \[Unreleased\][\s\S]*?(?=\n---)/);
if (!unreleasedMatch) {
  console.error('Could not find [Unreleased] section in CHANGELOG.md');
  process.exit(1);
}

const unreleasedBlock = unreleasedMatch[0];
const lines = unreleasedBlock.split('\n').slice(1);

const sections = { Added: [], Changed: [], Fixed: [] };
let currentSection = null;
for (const line of lines) {
  const sectionMatch = line.match(/^### (Added|Changed|Fixed)/);
  if (sectionMatch) { currentSection = sectionMatch[1]; continue; }
  const item = line.match(/^- (.+)/);
  if (item && currentSection) sections[currentSection].push(item[1]);
}

const hasContent = Object.values(sections).some(arr => arr.length > 0);
if (!hasContent) {
  console.error('No content in [Unreleased] — nothing to version.');
  console.error('Add entries under ### Added / Changed / Fixed in CHANGELOG.md first.');
  process.exit(1);
}

// ── Build snapshot BEFORE writing new version to package.json ────────
// (so the snapshot still shows the previous version in its badge)
const snapshotBase = `/versions/${newVersion}/`;
const snapshotTmp  = path.join(ROOT, '.snap-tmp');
const snapshotDest = path.join(ROOT, 'public', 'versions', newVersion);

console.log(`\nBuilding snapshot for v${newVersion}...`);
try {
  // Build to a temp dir outside of publicDir to avoid Vite's circular-copy check
  execSync(
    `npx vite build --base="${snapshotBase}" --outDir="${snapshotTmp}" --emptyOutDir`,
    { cwd: ROOT, stdio: 'inherit' }
  );
  fs.mkdirSync(path.dirname(snapshotDest), { recursive: true });
  if (fs.existsSync(snapshotDest)) fs.rmSync(snapshotDest, { recursive: true });
  fs.renameSync(snapshotTmp, snapshotDest);
  console.log(`✓ Snapshot saved to public/versions/${newVersion}/`);
} catch (err) {
  if (fs.existsSync(snapshotTmp)) fs.rmSync(snapshotTmp, { recursive: true });
  console.error('\n✗ Snapshot build failed — version files were NOT updated.');
  console.error('  Fix the build error and try again.\n');
  process.exit(1);
}

// ── Build new CHANGELOG.md ────────────────────────────────────────────
const newUnreleased = `## [Unreleased]
> Add your changes here as you work. Run \`npm run version:patch\` before pushing.

### Added
### Changed
### Fixed`;

const versionedEntry = buildVersionBlock(newVersion, today, sections);

const updatedChangelog = changelog.replace(
  /## \[Unreleased\][\s\S]*?(?=\n---)/,
  `${newUnreleased}\n\n---\n\n${versionedEntry}\n`
);

// ── Build new changelog.json ──────────────────────────────────────────
const existingJson = JSON.parse(fs.readFileSync(JSON_LOG, 'utf8'));
const newEntry = {
  version: newVersion,
  date:    today,
  url:     snapshotBase,
  changes: {
    Added:   sections.Added,
    Changed: sections.Changed,
    Fixed:   sections.Fixed,
  },
};
const updatedJson = [newEntry, ...existingJson];

// ── Write metadata files ──────────────────────────────────────────────
fs.writeFileSync(CHANGELOG, updatedChangelog);
pkg.version = newVersion;
fs.writeFileSync(PKG, JSON.stringify(pkg, null, 2) + '\n');
fs.writeFileSync(JSON_LOG, JSON.stringify(updatedJson, null, 2) + '\n');

console.log(`\n✓ Bumped to v${newVersion} (${bumpType})`);
console.log(`✓ Updated CHANGELOG.md, package.json, src/data/changelog.json`);
console.log(`✓ Snapshot at public/versions/${newVersion}/`);
console.log(`\nNext steps:`);
console.log(`  git add CHANGELOG.md package.json src/data/changelog.json public/versions/${newVersion}`);
console.log(`  git commit -m "chore: bump to v${newVersion}"`);
console.log(`  git push\n`);

// ── Helpers ───────────────────────────────────────────────────────────
function buildVersionBlock(version, date, sections) {
  let block = `## [${version}] — ${date}`;
  for (const [label, items] of Object.entries(sections)) {
    if (items.length === 0) continue;
    block += `\n### ${label}\n${items.map(i => `- ${i}`).join('\n')}`;
  }
  return block;
}
