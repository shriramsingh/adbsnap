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

// 3. Build Studio static assets (exact original React UI)
console.log('🎨 Compiling Studio UI (React 19 + Tailwind CSS + Lucide Icons)...');
fs.mkdirSync('dist/studio', { recursive: true });

const { execSync } = await import('node:child_process');
execSync('npx tailwindcss -i app/globals.css -o dist/studio/studio.css --minify', { stdio: 'inherit' });

await esbuild.build({
  entryPoints: ['studio/client.tsx'],
  bundle: true,
  platform: 'browser',
  format: 'esm',
  minify: true,
  outfile: 'dist/studio/studio.js',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  sourcemap: false,
});

const studioHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ADBSnap Studio — Automated Mobile Mockups</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><path d='M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z'/></svg>">
  <link rel="stylesheet" href="/studio.css">
</head>
<body class="bg-[#0a0b0e] text-slate-100 antialiased min-h-screen">
  <div id="root"></div>
  <script type="module" src="/studio.js"></script>
</body>
</html>`;
fs.writeFileSync('dist/studio/index.html', studioHtml, 'utf8');

const cliStats = fs.statSync('dist/bin/cli.js');
const studioJsStats = fs.statSync('dist/studio/studio.js');
const studioCssStats = fs.statSync('dist/studio/studio.css');
const totalMs = Date.now() - startTime;
console.log(`   ✔ CLI bundled: ${Math.round(cliStats.size / 1024)} KB`);
console.log(`   ✔ Studio UI bundled: JS ${Math.round(studioJsStats.size / 1024)} KB | CSS ${Math.round(studioCssStats.size / 1024)} KB`);
console.log(`   ✔ Total build completed in ${totalMs}ms`);
console.log(`✨ Ready for execution: node dist/bin/cli.js or npx adbsnap\n`);

