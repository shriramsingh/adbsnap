import { androidDriver } from './adb';
import { ADB_COMMANDS } from '../constants/commands';

export interface ElementBounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface UiNode {
  index: number;
  text: string;
  resourceId: string;
  className: string;
  packageName: string;
  contentDesc: string;
  bounds: ElementBounds;
  clickable: boolean;
  enabled: boolean;
  focused: boolean;
  scrollable: boolean;
  password: boolean;
  selected: boolean;
  children: UiNode[];
}

export interface ElementSelector {
  text?: string | RegExp;
  resourceId?: string | RegExp;
  contentDesc?: string | RegExp;
  className?: string;
  clickable?: boolean;
}

export interface NavigationTab {
  title: string;
  bounds: ElementBounds;
  node: UiNode;
}

export interface CrawlTabResult {
  tabIndex: number;
  title: string;
  screenshotBuffer: Buffer;
  elapsedMs: number;
}

/**
 * Escapes characters for Android shell `input text`.
 * Space is converted to `%s`, quotes and shell characters are escaped.
 */
export function escapeAdbText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/ /g, '%s')
    .replace(/&/g, '\\&')
    .replace(/</g, '\\<')
    .replace(/>/g, '\\>')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/;/g, '\\;')
    .replace(/\|/g, '\\|')
    .replace(/\$/g, '\\$');
}

/**
 * Parses bounding string `[x1,y1][x2,y2]` into numeric coordinates and center point.
 */
export function parseBounds(raw: string): ElementBounds {
  const m = raw.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!m) {
    return { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  }
  const x1 = parseInt(m[1], 10);
  const y1 = parseInt(m[2], 10);
  const x2 = parseInt(m[3], 10);
  const y2 = parseInt(m[4], 10);
  return {
    x1,
    y1,
    x2,
    y2,
    width: x2 - x1,
    height: y2 - y1,
    centerX: Math.round((x1 + x2) / 2),
    centerY: Math.round((y1 + y2) / 2),
  };
}

/**
 * Parses raw uiautomator XML string into a structured hierarchical tree and flat list.
 */
export function parseHierarchyXml(xmlContent: string): { root: UiNode[]; flat: UiNode[] } {
  // Extract content between <hierarchy...> and </hierarchy>
  const hierarchyMatch = xmlContent.match(/<hierarchy[^>]*>([\s\S]*?)<\/hierarchy>/i);
  if (!hierarchyMatch) {
    throw new Error('No valid <hierarchy> tag found in UI automator output.');
  }

  const innerXml = hierarchyMatch[1];
  const tagRegex = /<node\b([^>]*?)(\/?)>|<\/node>/gi;
  const attrRegex = /([a-zA-Z0-9_-]+)="([^"]*)"/g;

  const root: UiNode[] = [];
  const flat: UiNode[] = [];
  const stack: UiNode[] = [];

  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(innerXml)) !== null) {
    const fullTag = match[0];
    const rawAttrs = match[1];
    const isSelfClosing = match[2] === '/';

    if (fullTag.startsWith('</')) {
      // Closing tag </node>
      stack.pop();
      continue;
    }

    // Parse attributes
    const attrs: Record<string, string> = {};
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2];
    }

    const bounds = parseBounds(attrs['bounds'] || '');
    const node: UiNode = {
      index: parseInt(attrs['index'] || '0', 10),
      text: attrs['text'] || '',
      resourceId: attrs['resource-id'] || '',
      className: attrs['class'] || '',
      packageName: attrs['package'] || '',
      contentDesc: attrs['content-desc'] || '',
      bounds,
      clickable: attrs['clickable'] === 'true',
      enabled: attrs['enabled'] === 'true',
      focused: attrs['focused'] === 'true',
      scrollable: attrs['scrollable'] === 'true',
      password: attrs['password'] === 'true',
      selected: attrs['selected'] === 'true',
      children: [],
    };

    if (stack.length > 0) {
      stack[stack.length - 1].children.push(node);
    } else {
      root.push(node);
    }

    flat.push(node);

    if (!isSelfClosing) {
      stack.push(node);
    }
  }

  return { root, flat };
}

/**
 * Filter nodes by matching text, resource ID, or content-desc.
 */
export function findNodes(flat: UiNode[], selector: ElementSelector): UiNode[] {
  return flat.filter((node) => {
    if (selector.clickable !== undefined && node.clickable !== selector.clickable) {
      return false;
    }
    if (selector.className && node.className !== selector.className) {
      return false;
    }
    if (selector.text !== undefined) {
      if (typeof selector.text === 'string') {
        const query = selector.text.toLowerCase();
        if (!node.text.toLowerCase().includes(query)) return false;
      } else if (!selector.text.test(node.text)) {
        return false;
      }
    }
    if (selector.resourceId !== undefined) {
      if (typeof selector.resourceId === 'string') {
        const query = selector.resourceId.toLowerCase();
        if (!node.resourceId.toLowerCase().includes(query)) return false;
      } else if (!selector.resourceId.test(node.resourceId)) {
        return false;
      }
    }
    if (selector.contentDesc !== undefined) {
      if (typeof selector.contentDesc === 'string') {
        const query = selector.contentDesc.toLowerCase();
        if (!node.contentDesc.toLowerCase().includes(query)) return false;
      } else if (!selector.contentDesc.test(node.contentDesc)) {
        return false;
      }
    }
    return true;
  });
}

export function findNode(flat: UiNode[], selector: ElementSelector): UiNode | undefined {
  const results = findNodes(flat, selector);
  return results[0];
}

/**
 * Automatically discovers navigation tab bars (e.g. BottomNavigationView, TabLayout)
 * by finding horizontally aligned interactive items in the bottom 25% of the screen.
 */
export function findNavigationTabs(flat: UiNode[]): NavigationTab[] {
  if (flat.length === 0) return [];

  // Determine max screen dimensions from root bounds
  const maxY = Math.max(...flat.map((n) => n.bounds.y2));
  const bottomThreshold = maxY * 0.72; // Look in bottom 28% of display

  // Filter candidate nodes in bottom region
  const bottomNodes = flat.filter((n) => {
    const isBottom = n.bounds.centerY >= bottomThreshold;
    const hasLabel = Boolean(n.text.trim() || n.contentDesc.trim());
    return isBottom && hasLabel;
  });

  if (bottomNodes.length === 0) return [];

  // Group candidate nodes by common horizontal line (similar centerY within 50px)
  const rows = new Map<number, UiNode[]>();
  for (const node of bottomNodes) {
    let matchedRowKey: number | null = null;
    for (const key of rows.keys()) {
      if (Math.abs(key - node.bounds.centerY) <= 50) {
        matchedRowKey = key;
        break;
      }
    }

    if (matchedRowKey !== null) {
      rows.get(matchedRowKey)!.push(node);
    } else {
      rows.set(node.bounds.centerY, [node]);
    }
  }

  // Find the row that best resembles a tab bar (2 to 6 evenly spaced elements)
  let bestRow: UiNode[] = [];
  for (const row of rows.values()) {
    if (row.length >= 2 && row.length <= 8) {
      if (row.length > bestRow.length) {
        bestRow = row;
      }
    }
  }

  if (bestRow.length === 0) return [];

  // Sort by X coordinate from left to right
  bestRow.sort((a, b) => a.bounds.centerX - b.bounds.centerX);

  // Deduplicate items that have nearly identical centerX (e.g. icon View + TextView label)
  const uniqueTabs: NavigationTab[] = [];
  for (const node of bestRow) {
    const title = (node.text || node.contentDesc || `Tab ${uniqueTabs.length + 1}`).trim();
    const isDuplicate = uniqueTabs.some(
      (t) => Math.abs(t.bounds.centerX - node.bounds.centerX) < 60 || t.title.toLowerCase() === title.toLowerCase()
    );

    if (!isDuplicate) {
      uniqueTabs.push({
        title,
        bounds: node.bounds,
        node,
      });
    }
  }

  return uniqueTabs;
}

export class UiCrawler {
  /**
   * Dumps and parses active screen UI hierarchy into structured nodes.
   */
  async dumpHierarchy(deviceId?: string): Promise<{ root: UiNode[]; flat: UiNode[] }> {
    const prefix = deviceId ? ['-s', deviceId] : [];
    const rawOutput = await androidDriver.exec([...prefix, ...ADB_COMMANDS.UIAUTOMATOR_DUMP]);
    return parseHierarchyXml(rawOutput);
  }

  /**
   * Simulates a screen tap at exact pixel coordinates.
   */
  async tap(x: number, y: number, deviceId?: string): Promise<void> {
    const prefix = deviceId ? ['-s', deviceId] : [];
    await androidDriver.exec([...prefix, ...ADB_COMMANDS.INPUT_TAP(x, y)]);
  }

  /**
   * Types text into the currently focused input field.
   */
  async typeText(text: string, deviceId?: string): Promise<void> {
    const prefix = deviceId ? ['-s', deviceId] : [];
    const escaped = escapeAdbText(text);
    await androidDriver.exec([...prefix, ...ADB_COMMANDS.INPUT_TEXT(escaped)]);
  }

  /**
   * Dispatches a key event (e.g. 66 for Enter, 4 for Back).
   */
  async pressKey(keyCode: number | string, deviceId?: string): Promise<void> {
    const prefix = deviceId ? ['-s', deviceId] : [];
    await androidDriver.exec([...prefix, ...ADB_COMMANDS.INPUT_KEY(keyCode)]);
  }

  /**
   * Simulates a swipe motion between two coordinates.
   */
  async swipe(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    durationMs: number = 300,
    deviceId?: string
  ): Promise<void> {
    const prefix = deviceId ? ['-s', deviceId] : [];
    await androidDriver.exec([...prefix, ...ADB_COMMANDS.INPUT_SWIPE(x1, y1, x2, y2, durationMs)]);
  }

  /**
   * Finds an element on the active screen and taps its center coordinates.
   */
  async tapElement(selector: ElementSelector, deviceId?: string): Promise<UiNode> {
    const { flat } = await this.dumpHierarchy(deviceId);
    const target = findNode(flat, selector);

    if (!target) {
      const summary = flat
        .filter((n) => n.text || n.contentDesc || n.resourceId)
        .slice(0, 10)
        .map((n) => `"${n.text || n.contentDesc || n.resourceId}"`)
        .join(', ');
      throw new Error(
        `Element matching ${JSON.stringify(selector)} not found. Sample elements on screen: [${summary}]`
      );
    }

    await this.tap(target.bounds.centerX, target.bounds.centerY, deviceId);
    return target;
  }

  /**
   * Focuses an element (e.g. EditText) by tapping it, pauses, and types text.
   */
  async tapAndType(
    selector: ElementSelector,
    text: string,
    deviceId?: string,
    focusDelayMs: number = 300
  ): Promise<UiNode> {
    const node = await this.tapElement(selector, deviceId);
    if (focusDelayMs > 0) {
      await new Promise((r) => setTimeout(r, focusDelayMs));
    }
    await this.typeText(text, deviceId);
    return node;
  }

  /**
   * Repeatedly inspects the UI hierarchy until animations/spinners stabilize.
   */
  async waitForLayoutSettle(timeoutMs: number = 4000, checkIntervalMs: number = 400, deviceId?: string): Promise<void> {
    const startTime = performance.now();
    let previousCount = -1;

    while (performance.now() - startTime < timeoutMs) {
      try {
        const { flat } = await this.dumpHierarchy(deviceId);
        if (flat.length === previousCount && flat.length > 5) {
          // Layout stabilized
          return;
        }
        previousCount = flat.length;
      } catch {
        // Retry
      }
      await new Promise((r) => setTimeout(r, checkIntervalMs));
    }
  }

  /**
   * Discovers bottom navigation tabs and sequentially clicks each tab,
   * waiting for the screen to settle and capturing pristine screenshot buffers.
   */
  async crawlTabs(
    deviceId?: string,
    onProgress?: (tab: NavigationTab, index: number, total: number) => void
  ): Promise<CrawlTabResult[]> {
    // 1. Dump current screen to discover tabs
    const { flat } = await this.dumpHierarchy(deviceId);
    const tabs = findNavigationTabs(flat);

    if (tabs.length === 0) {
      throw new Error('No bottom navigation tab bar detected on the active screen.');
    }

    const results: CrawlTabResult[] = [];

    // 2. Sequentially tap each tab and capture
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      if (onProgress) onProgress(tab, i, tabs.length);

      const start = performance.now();

      // Tap tab center coordinates
      await this.tap(tab.bounds.centerX, tab.bounds.centerY, deviceId);

      // Wait for tab animation & data load to settle
      await new Promise((r) => setTimeout(r, 600));

      // Capture screenshot buffer directly in memory
      const screenshotBuffer = await androidDriver.captureScreenshot(deviceId);
      const elapsedMs = Math.round(performance.now() - start);

      results.push({
        tabIndex: i + 1,
        title: tab.title,
        screenshotBuffer,
        elapsedMs,
      });
    }

    return results;
  }

  /**
   * Auto-detects login input fields and injects credentials to solve the empty-screen problem.
   */
  async autoLogin(credentials: { username?: string; password?: string }, deviceId?: string): Promise<boolean> {
    if (!credentials.username && !credentials.password) return false;

    const { flat } = await this.dumpHierarchy(deviceId);

    // Look for email / username field
    const userField = flat.find(
      (n) =>
        (n.className.includes('EditText') || n.clickable) &&
        !n.password &&
        (n.text.toLowerCase().includes('email') ||
          n.text.toLowerCase().includes('user') ||
          n.resourceId.toLowerCase().includes('email') ||
          n.resourceId.toLowerCase().includes('user'))
    );

    // Look for password field
    const passField = flat.find(
      (n) =>
        n.password ||
        (n.className.includes('EditText') &&
          (n.text.toLowerCase().includes('pass') || n.resourceId.toLowerCase().includes('pass')))
    );

    let typed = false;
    if (userField && credentials.username) {
      await this.tap(userField.bounds.centerX, userField.bounds.centerY, deviceId);
      await new Promise((r) => setTimeout(r, 200));
      await this.typeText(credentials.username, deviceId);
      typed = true;
    }

    if (passField && credentials.password) {
      await this.tap(passField.bounds.centerX, passField.bounds.centerY, deviceId);
      await new Promise((r) => setTimeout(r, 200));
      await this.typeText(credentials.password, deviceId);
      typed = true;
    }

    if (typed) {
      // Look for submit button
      const submitBtn = flat.find(
        (n) =>
          n.clickable &&
          (n.text.toLowerCase().includes('sign in') ||
            n.text.toLowerCase().includes('log in') ||
            n.text.toLowerCase().includes('login') ||
            n.text.toLowerCase().includes('continue'))
      );

      if (submitBtn) {
        await new Promise((r) => setTimeout(r, 300));
        await this.tap(submitBtn.bounds.centerX, submitBtn.bounds.centerY, deviceId);
        await new Promise((r) => setTimeout(r, 1200));
      }
    }

    return typed;
  }
}

export const uiCrawler = new UiCrawler();
