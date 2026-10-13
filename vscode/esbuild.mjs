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
    external: ['vscode', 'sharp'],
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

    // Copy bundled CLI and Studio static assets so extension is fully self-contained
    const fs = await import('node:fs');
    const rootDistBin = path.resolve(__dirname, '..', 'dist', 'bin');
    const rootDistStudio = path.resolve(__dirname, '..', 'dist', 'studio');
    const targetDistBin = path.resolve(__dirname, 'dist', 'bin');
    const targetDistStudio = path.resolve(__dirname, 'dist', 'studio');

    if (fs.existsSync(rootDistBin)) {
      fs.mkdirSync(targetDistBin, { recursive: true });
      fs.cpSync(rootDistBin, targetDistBin, { recursive: true });
    }
    if (fs.existsSync(rootDistStudio)) {
      fs.mkdirSync(targetDistStudio, { recursive: true });
      fs.cpSync(rootDistStudio, targetDistStudio, { recursive: true });
    }

    console.log('✅ VS Code extension bundle created successfully at vscode/dist/extension.js');
  }
}

build().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
