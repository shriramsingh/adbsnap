import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';

/**
 * Copies a PNG image buffer directly to the OS clipboard across Windows, macOS, and Linux.
 */
export async function copyImageBufferToClipboard(buffer: Buffer): Promise<void> {
  const tempPath = path.join(os.tmpdir(), `adbsnap-clip-${Date.now()}.png`);
  await fs.writeFile(tempPath, buffer);

  try {
    const platform = process.platform;

    if (platform === 'win32') {
      // Windows: PowerShell script using Windows Forms & System.Drawing
      const psCommand = `
Add-Type -AssemblyName System.Windows.Forms;
Add-Type -AssemblyName System.Drawing;
$img = [System.Drawing.Image]::FromFile('${tempPath.replace(/\\/g, '\\\\')}');
[System.Windows.Forms.Clipboard]::SetImage($img);
$img.Dispose();
`;
      await new Promise<void>((resolve, reject) => {
        execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psCommand], (err, _stdout, stderr) => {
          if (err) {
            reject(new Error(`Clipboard error: ${stderr || err.message}`));
          } else {
            resolve();
          }
        });
      });
    } else if (platform === 'darwin') {
      // macOS: AppleScript reading PNG into clipboard
      await new Promise<void>((resolve, reject) => {
        execFile(
          'osascript',
          ['-e', `set the clipboard to (read (POSIX file "${tempPath}") as «class PNGf»)`],
          (err, _stdout, stderr) => {
            if (err) {
              reject(new Error(`Clipboard error: ${stderr || err.message}`));
            } else {
              resolve();
            }
          }
        );
      });
    } else {
      // Linux: Use xclip or wl-copy if available
      await new Promise<void>((resolve, reject) => {
        execFile('xclip', ['-selection', 'clipboard', '-t', 'image/png', '-i', tempPath], (err) => {
          if (err) {
            // Try wl-copy for Wayland
            execFile('wl-copy', ['-t', 'image/png'], { input: buffer } as any, (err2) => {
              if (err2) {
                reject(new Error('Please install xclip or wl-clipboard to copy images on Linux.'));
              } else {
                resolve();
              }
            });
          } else {
            resolve();
          }
        });
      });
    }
  } finally {
    // Delay temporary file cleanup slightly so clipboard reader releases handle
    setTimeout(async () => {
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignored
      }
    }, 2000);
  }
}
