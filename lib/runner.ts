import { androidDriver } from './adb';
import { uiCrawler, type ElementSelector } from './crawler';
import { freshRestartApp } from './commands/composite';
import { compositeFrame } from './sharp';
import type { LayoutMode } from '../constants/themes';

export type FlowAction =
  | { type: 'launch'; package: string; fresh?: boolean }
  | { type: 'reset'; package: string }
  | { type: 'kill'; package: string }
  | { type: 'tap'; target: string | ElementSelector; waitMs?: number }
  | { type: 'type'; target?: string | ElementSelector; value: string; waitMs?: number }
  | { type: 'key'; code: string | number }
  | { type: 'wait'; durationMs: number }
  | { type: 'waitForText'; text: string; timeoutMs?: number }
  | { type: 'snap'; name: string; title: string; subtitle?: string; stars?: boolean };

export interface FlowConfig {
  app?: string;
  package?: string;
  theme?: string;
  frame?: string;
  layout?: LayoutMode;
  font?: string;
  auth?: {
    username?: string;
    password?: string;
  };
  flow: FlowAction[];
  targets?: string[];
}

export interface CapturedFlowScreen {
  name: string;
  title: string;
  subtitle?: string;
  rawBuffer: Buffer;
  compositedBuffer: Buffer;
  elapsedMs: number;
}

export type ProgressCallback = (step: number, total: number, action: FlowAction, message: string) => void;

export class FlowRunner {
  /**
   * Resolves credential placeholders ($auth.username, $auth.password) from config auth context.
   */
  private resolveValue(value: string, auth?: { username?: string; password?: string }): string {
    if (!auth) return value;
    let resolved = value;
    if (auth.username) {
      resolved = resolved.replace(/\$auth\.username/g, auth.username);
    }
    if (auth.password) {
      resolved = resolved.replace(/\$auth\.password/g, auth.password);
    }
    return resolved;
  }

  /**
   * Executes an end-to-end automated action flow on the target device.
   */
  async runFlow(
    config: FlowConfig,
    options?: {
      deviceId?: string;
      onProgress?: ProgressCallback;
    }
  ): Promise<CapturedFlowScreen[]> {
    const deviceId = options?.deviceId;
    const actions = config.flow;
    const screens: CapturedFlowScreen[] = [];

    const theme = config.theme || 'studioLight';
    const frame = config.frame || 'iphone-16-pro';
    const layout = config.layout || 'appstore';
    const font = config.font || 'modern';

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const stepNum = i + 1;

      switch (action.type) {
        case 'reset': {
          if (options?.onProgress) {
            options.onProgress(stepNum, actions.length, action, `Wiping cache & tokens for ${action.package}`);
          }
          await androidDriver.resetAppData(action.package, deviceId);
          break;
        }

        case 'kill': {
          if (options?.onProgress) {
            options.onProgress(stepNum, actions.length, action, `Killing app process ${action.package}`);
          }
          await androidDriver.killApp(action.package, deviceId);
          break;
        }

        case 'launch': {
          if (options?.onProgress) {
            options.onProgress(
              stepNum,
              actions.length,
              action,
              `${action.fresh ? 'Fresh restarting' : 'Launching'} ${action.package}`
            );
          }
          if (action.fresh) {
            await freshRestartApp(androidDriver, action.package, deviceId);
          } else {
            await androidDriver.launchApp(action.package, deviceId);
          }
          // Await cold launch animation
          await new Promise((r) => setTimeout(r, 1200));
          break;
        }

        case 'tap': {
          const selector: ElementSelector =
            typeof action.target === 'string' ? { text: action.target } : action.target;
          const targetDesc = typeof action.target === 'string' ? action.target : JSON.stringify(action.target);

          if (options?.onProgress) {
            options.onProgress(stepNum, actions.length, action, `Tapping element: "${targetDesc}"`);
          }

          await uiCrawler.tapElement(selector, deviceId);
          await new Promise((r) => setTimeout(r, action.waitMs ?? 500));
          break;
        }

        case 'type': {
          const textToType = this.resolveValue(action.value, config.auth);

          if (action.target) {
            const selector: ElementSelector =
              typeof action.target === 'string' ? { text: action.target } : action.target;
            const targetDesc = typeof action.target === 'string' ? action.target : JSON.stringify(action.target);

            if (options?.onProgress) {
              options.onProgress(stepNum, actions.length, action, `Typing into "${targetDesc}"`);
            }
            await uiCrawler.tapAndType(selector, textToType, deviceId);
          } else {
            if (options?.onProgress) {
              options.onProgress(stepNum, actions.length, action, `Typing text: "${textToType}"`);
            }
            await uiCrawler.typeText(textToType, deviceId);
          }

          await new Promise((r) => setTimeout(r, action.waitMs ?? 400));
          break;
        }

        case 'wait': {
          if (options?.onProgress) {
            options.onProgress(stepNum, actions.length, action, `Waiting for ${action.durationMs}ms...`);
          }
          await new Promise((r) => setTimeout(r, action.durationMs));
          break;
        }

        case 'waitForText': {
          if (options?.onProgress) {
            options.onProgress(stepNum, actions.length, action, `Waiting for "${action.text}" to appear on screen...`);
          }

          const timeoutMs = action.timeoutMs ?? 5000;
          const start = performance.now();
          let found = false;

          while (performance.now() - start < timeoutMs) {
            try {
              const { flat } = await uiCrawler.dumpHierarchy(deviceId);
              if (flat.some((n) => n.text.toLowerCase().includes(action.text.toLowerCase()))) {
                found = true;
                break;
              }
            } catch {
              // Retry
            }
            await new Promise((r) => setTimeout(r, 400));
          }

          if (!found) {
            throw new Error(`Timeout after ${timeoutMs}ms waiting for text: "${action.text}"`);
          }
          break;
        }

        case 'key': {
          if (options?.onProgress) {
            options.onProgress(stepNum, actions.length, action, `Dispatching key event: ${action.code}`);
          }
          await uiCrawler.pressKey(action.code, deviceId);
          await new Promise((r) => setTimeout(r, 300));
          break;
        }

        case 'snap': {
          if (options?.onProgress) {
            options.onProgress(stepNum, actions.length, action, `Capturing screen: "${action.title}"`);
          }

          const snapStart = performance.now();
          const rawBuffer = await androidDriver.captureScreenshot(deviceId);

          const composited = await compositeFrame({
            screenshotBuffer: rawBuffer,
            bezelId: frame,
            gradientPreset: theme,
            layout,
            font,
            title: action.title,
            subtitle: action.subtitle,
            showStarBadge: action.stars ?? true,
          });

          const elapsedMs = Math.round(performance.now() - snapStart);

          screens.push({
            name: action.name,
            title: action.title,
            subtitle: action.subtitle,
            rawBuffer,
            compositedBuffer: composited.buffer,
            elapsedMs,
          });
          break;
        }
      }
    }

    return screens;
  }
}

export const flowRunner = new FlowRunner();
