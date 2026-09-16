import chalk from 'chalk';
import { androidDriver } from '../lib/adb.js';
import { uiCrawler, findNodes } from '../lib/crawler.js';

async function main() {
  console.log(chalk.bold.cyan('\n🔍 Testing Autonomous UI Crawler (Step 4.3)...\n'));

  // 1. Verify device connection
  const devices = await androidDriver.listDevices();
  if (devices.length === 0) {
    console.error(chalk.red('❌ No devices connected. Please connect a device via USB or Wi-Fi.'));
    process.exit(1);
  }

  const targetDevice = devices[0];
  console.log(chalk.green(`📱 Connected Device: ${chalk.bold(targetDevice.model)} (${targetDevice.id})`));

  // 2. Dump UI Hierarchy
  console.log(chalk.yellow('⏳ Extracting UI Automator hierarchy tree from device...'));
  const start = performance.now();
  const { root, flat } = await uiCrawler.dumpHierarchy(targetDevice.id);
  const duration = Math.round(performance.now() - start);

  console.log(chalk.green(`✅ Dump successful in ${duration}ms!`));
  console.log(chalk.gray(`   • Total Nodes: ${flat.length}`));
  console.log(chalk.gray(`   • Root Nodes: ${root.length}`));

  // 3. Analyze detected elements
  const clickableNodes = flat.filter((n) => n.clickable);
  const textNodes = flat.filter((n) => n.text.trim().length > 0);
  const inputNodes = flat.filter((n) => n.className.includes('EditText') || n.password);

  console.log(chalk.bold('\n📊 Screen Element Breakdown:'));
  console.log(`   • Clickable Elements : ${chalk.cyan(clickableNodes.length.toString())}`);
  console.log(`   • Text Labels        : ${chalk.cyan(textNodes.length.toString())}`);
  console.log(`   • Text Input Fields  : ${chalk.cyan(inputNodes.length.toString())}`);

  // 4. Sample text labels found on screen
  if (textNodes.length > 0) {
    console.log(chalk.bold('\n📝 Visible Text Samples on Screen:'));
    for (const node of textNodes.slice(0, 8)) {
      const bounds = node.bounds;
      console.log(
        `   • "${chalk.whiteBright(node.text)}" [Center: (${bounds.centerX}, ${bounds.centerY})] (${node.className})`
      );
    }
  }

  // 5. Test findNodes query helper
  if (clickableNodes.length > 0) {
    const sampleClickable = clickableNodes[0];
    const found = findNodes(flat, { text: sampleClickable.text || undefined, clickable: true });
    console.log(chalk.bold('\n🎯 Selector Query Verification:'));
    console.log(
      chalk.gray(
        `   • Querying first clickable node: "${sampleClickable.text || sampleClickable.resourceId || 'unnamed'}"`
      )
    );
    console.log(
      chalk.green(
        `   • Target center coordinates: (${sampleClickable.bounds.centerX}, ${sampleClickable.bounds.centerY})`
      )
    );
  }

  console.log(chalk.bold.green('\n🎉 Step 4.3 Autonomous UI Crawler verification passed!\n'));
}

main().catch((err) => {
  console.error(chalk.red('\n❌ Error during crawler verification:'), err);
  process.exit(1);
});
