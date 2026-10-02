import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootPkgPath = path.resolve('package.json');
const vscodePkgPath = path.resolve('vscode/package.json');
const stringsPath = path.resolve('constants/strings.ts');

const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
const vscodePkg = JSON.parse(fs.readFileSync(vscodePkgPath, 'utf8'));

// Determine target version
const target = process.argv[2] || 'patch';
let nextVersion = target;

if (['patch', 'minor', 'major'].includes(target)) {
  const [major, minor, patch] = rootPkg.version.split('.').map(Number);
  if (target === 'patch') nextVersion = `${major}.${minor}.${patch + 1}`;
  else if (target === 'minor') nextVersion = `${major}.${minor + 1}.0`;
  else if (target === 'major') nextVersion = `${major + 1}.0.0`;
}

console.log(`\n🚀 Synchronizing NPM & VS Code Marketplace versions to: v${nextVersion}\n`);

// 1. Update root package.json
rootPkg.version = nextVersion;
fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n', 'utf8');
console.log(`✔ [1/3] Updated package.json -> ${nextVersion}`);

// 2. Update vscode/package.json
vscodePkg.version = nextVersion;
fs.writeFileSync(vscodePkgPath, JSON.stringify(vscodePkg, null, 2) + '\n', 'utf8');
console.log(`✔ [2/3] Updated vscode/package.json -> ${nextVersion}`);

// 3. Update constants/strings.ts
let stringsContent = fs.readFileSync(stringsPath, 'utf8');
stringsContent = stringsContent.replace(/VERSION:\s*['"][^'"]+['"]/, `VERSION: '${nextVersion}'`);
fs.writeFileSync(stringsPath, stringsContent, 'utf8');
console.log(`✔ [3/3] Updated constants/strings.ts -> ${nextVersion}`);

// 4. Rebuild CLI & Studio SPA
console.log('\n📦 [CLI] Rebuilding Standalone CLI & Pre-compiled Studio SPA...');
execSync('npm run build:cli', { stdio: 'inherit' });

// 5. Rebuild VS Code Extension
console.log('\n📦 [VS Code] Compiling Extension bundle...');
execSync('npm run build:vscode', { stdio: 'inherit' });

// 6. Package VS Code Extension into .vsix
console.log('\n📦 [VS Code] Packaging extension into .vsix archive...');
execSync('npm run package:vscode', { stdio: 'inherit' });

console.log(`\n🎉 Success! Both packages are now synchronized and ready for publication:`);
console.log(`   • NPM Package: adbsnap@${nextVersion} (ready for 'npm publish')`);
console.log(`   • VS Code Extension: vscode/adbsnap-${nextVersion}.vsix (ready for Marketplace upload)\n`);