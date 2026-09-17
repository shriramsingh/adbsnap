import { execFile } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

/**
 * Resolves the path to the adbsnap CLI executable.
 *
 * Resolution order:
 * 1. Local project binary at `<extensionRoot>/../dist/bin/cli.js` (monorepo dev)
 * 2. Globally installed `adbsnap` on PATH
 * 3. Falls back to `npx adbsnap` execution
 */
export interface CliRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

type CliRunner = {
  command: string;
  prefixArgs: string[];
  label: string;
};

function resolveCliRunner(extensionPath: string): CliRunner {
  // 1. Check local monorepo compiled CLI
  const localCli = path.resolve(extensionPath, '..', 'dist', 'bin', 'cli.js');
  if (fs.existsSync(localCli)) {
    return {
      command: process.execPath, // node
      prefixArgs: [localCli],
      label: `node ${localCli}`,
    };
  }

  // 2. Check local monorepo source CLI (via tsx)
  const localSrcCli = path.resolve(extensionPath, '..', 'bin', 'cli.ts');
  if (fs.existsSync(localSrcCli)) {
    // Look for tsx in the monorepo node_modules
    const tsxBin = path.resolve(extensionPath, '..', 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
    if (fs.existsSync(tsxBin)) {
      return {
        command: tsxBin,
        prefixArgs: [localSrcCli],
        label: `tsx ${localSrcCli}`,
      };
    }
  }

  // 3. Fall back to globally installed adbsnap or npx
  return {
    command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
    prefixArgs: ['adbsnap'],
    label: 'npx adbsnap',
  };
}

/**
 * Executes an adbsnap CLI command and returns the result.
 */
export async function runAdbSnapCli(
  extensionPath: string,
  args: string[],
  timeoutMs: number = 30000
): Promise<CliRunResult> {
  const runner = resolveCliRunner(extensionPath);

  return new Promise((resolve) => {
    execFile(
      runner.command,
      [...runner.prefixArgs, ...args],
      {
        timeout: timeoutMs,
        maxBuffer: 50 * 1024 * 1024,
        cwd: path.resolve(extensionPath, '..'),
        env: { ...process.env, FORCE_COLOR: '0' }, // Disable chalk colors in output
      },
      (err, stdout, stderr) => {
        resolve({
          stdout: stdout?.toString() || '',
          stderr: stderr?.toString() || '',
          exitCode: err ? (err as any).code ?? 1 : 0,
        });
      }
    );
  });
}

/**
 * Returns a human-readable label for the resolved CLI runner (for diagnostics).
 */
export function getCliRunnerLabel(extensionPath: string): string {
  return resolveCliRunner(extensionPath).label;
}
