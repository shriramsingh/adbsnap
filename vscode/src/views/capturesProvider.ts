import * as vscode from 'vscode';
import fs from 'node:fs';
import path from 'node:path';

export class CaptureTreeItem extends vscode.TreeItem {
  constructor(
    public readonly filePath: string,
    public readonly fileName: string,
    public readonly stats: fs.Stats
  ) {
    super(fileName, vscode.TreeItemCollapsibleState.None);

    const sizeKb = (stats.size / 1024).toFixed(1);
    const sizeStr = stats.size > 1024 * 1024 ? `${(stats.size / (1024 * 1024)).toFixed(1)} MB` : `${sizeKb} KB`;
    const dateStr = stats.mtime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.description = `${sizeStr} • ${dateStr}`;
    this.tooltip = `${fileName}\nSize: ${sizeStr}\nSaved: ${stats.mtime.toLocaleString()}`;

    const isZip = fileName.endsWith('.zip');
    this.iconPath = new vscode.ThemeIcon(isZip ? 'archive' : 'file-media');
    this.contextValue = isZip ? 'capture-zip' : 'capture-image';

    this.command = {
      command: 'vscode.open',
      title: 'Open File',
      arguments: [vscode.Uri.file(filePath)],
    };
  }
}

export class CapturesTreeDataProvider implements vscode.TreeDataProvider<CaptureTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<CaptureTreeItem | undefined | null | void> =
    new vscode.EventEmitter<CaptureTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<CaptureTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor(private getOutputDir: () => string) {}

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: CaptureTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<CaptureTreeItem[]> {
    const outDir = this.getOutputDir();

    if (!fs.existsSync(outDir)) {
      return [];
    }

    try {
      const entries = fs.readdirSync(outDir, { withFileTypes: true });
      const items: CaptureTreeItem[] = [];

      for (const entry of entries) {
        if (entry.isFile() && (entry.name.endsWith('.png') || entry.name.endsWith('.jpg') || entry.name.endsWith('.zip'))) {
          const fullPath = path.join(outDir, entry.name);
          const stats = fs.statSync(fullPath);
          items.push(new CaptureTreeItem(fullPath, entry.name, stats));
        } else if (entry.isDirectory() && entry.name.startsWith('export-')) {
          // Check for zip or images inside export folder
          const subDir = path.join(outDir, entry.name);
          const subStats = fs.statSync(subDir);
          items.push(new CaptureTreeItem(subDir, `📁 ${entry.name}`, subStats));
        }
      }

      // Sort newest first
      items.sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs);

      return items;
    } catch {
      return [];
    }
  }
}
