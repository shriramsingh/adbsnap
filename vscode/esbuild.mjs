import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function build() {
  const isWatch = process.argv.includes('--watch');

  const context = await esbuild.context({
    entryPoints: [path.resolve(__dirname, 'src/extension.ts')],
    bundle: true,
    outfile: path.resolve(__dirname, 'dist/extension.js'),
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    sourcemap: true,
    logLevel: 'info',
  });

  if (isWatch) {
    console.log('👀 Watching for changes in vscode extension...');
    await context.watch();
  } else {
    await context.rebuild();
    await context.dispose();
    console.log('✅ VS Code extension bundle created successfully at vscode/dist/extension.js');
  }
}

build().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
