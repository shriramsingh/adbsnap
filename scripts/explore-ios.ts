import assert from 'node:assert/strict';
import { exploreIosTabs } from '../lib/ios-explorer.js';
import { parsePngMetadata } from '../utils/png.js';

async function main(): Promise<void> {
  const screenshots = await exploreIosTabs({
    bundleIdentifier: 'com.adbsnap.AutoExplorerDemo',
  });

  if (screenshots.length < 5) {
    throw new Error(`Expected demo tabs plus nested detail screens, received ${screenshots.length} screenshots.`);
  }
  const screenNames = screenshots.map(({ title }) =>
    title
      .replace(/^ADBSnap-screen-\d+-/, '')
      .replace(/_\d+_[A-F0-9-]+\.png$/i, '')
  );
  assert.deepEqual(screenNames.slice(0, 3), ['Home', 'Search', 'Profile']);
  assert.ok(screenNames.includes('Home-View-Details'));
  assert.ok(screenNames.includes('Home-View-Details-More-Info'));
  for (const screenshot of screenshots) {
    if (!parsePngMetadata(screenshot.buffer).isValid) {
      throw new Error(`XCTest returned an invalid PNG for ${screenshot.title}.`);
    }
  }

  console.log(
    `iOS simulator Auto Explorer test passed: captured ${screenshots.length} demo screens, including nested navigation.`
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
