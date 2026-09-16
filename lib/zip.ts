import { ZipArchive } from 'archiver';
import { PassThrough } from 'node:stream';
import fs from 'node:fs';
import path from 'node:path';

export interface ZipFileInput {
  path: string;
  buffer: Buffer;
}

/**
 * Creates an in-memory ZIP archive from a collection of buffer files.
 * Zero temporary files written to disk during the streaming process.
 */
export async function createStoreZip(files: ZipFileInput[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = new ZipArchive({ zlib: { level: 9 } });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];


    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
    archive.on('error', reject);

    archive.pipe(stream);

    for (const file of files) {
      archive.append(file.buffer, { name: file.path });
    }

    archive.finalize();
  });
}

/**
 * Writes a ZIP archive to a destination file path using in-memory streaming.
 */
export async function saveStoreZip(files: ZipFileInput[], outputPath: string): Promise<number> {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const zipBuffer = await createStoreZip(files);
  fs.writeFileSync(outputPath, zipBuffer);
  return zipBuffer.length;
}
