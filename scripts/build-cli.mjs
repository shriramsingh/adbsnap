import * as esbuild from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';

const startTime = Date.now();
console.log('🚀 Building ADBSnap / Snapshot CLI (Standalone ESM Bundler)...\n');

// 1. Clean dist directory completely to ensure no un-mangled files or metadata leak
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
fs.mkdirSync('dist/bin', { recursive: true });

// 2. Build the CLI executable (dist/bin/cli.js)
console.log('📦 Bundling CLI executable: bin/cli.ts -> dist/bin/cli.js ...');
await esbuild.build({
  entryPoints: ['bin/cli.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  minify: true,
  external: ['sharp', 'archiver'],
  outfile: 'dist/bin/cli.js',
  sourcemap: false,
});

// Ensure executable permissions on Unix/macOS
try {
  fs.chmodSync('dist/bin/cli.js', '755');
} catch {
  // Ignored on Windows
}

const cliStats = fs.statSync('dist/bin/cli.js');
const totalMs = Date.now() - startTime;
console.log(`   ✔ CLI bundled successfully in ${totalMs}ms (${Math.round(cliStats.size / 1024)} KB)`);
console.log(`✨ Ready for execution: node dist/bin/cli.js or npx adbsnap / npx snapshot\n`);
