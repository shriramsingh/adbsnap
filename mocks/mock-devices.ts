import type { ConnectedDevice } from '../lib/driver.js';

export const MOCK_DEVICES: ConnectedDevice[] = [
  {
    id: 'RFCW10293847',
    platform: 'android',
    type: 'usb',
    model: 'Pixel 9 Pro',
    product: 'komodo',
    isAuthorized: true,
    rawStatus: 'device',
  },
  {
    id: '192.168.1.55:5555',
    platform: 'android',
    type: 'wifi',
    model: 'Galaxy S25 Ultra',
    product: 'e3q',
    isAuthorized: true,
    rawStatus: 'device',
  },
  {
    id: 'emulator-5554',
    platform: 'android',
    type: 'emulator',
    model: 'Pixel 8 API 35',
    product: 'sdk_gphone64_x86_64',
    isAuthorized: true,
    rawStatus: 'device',
  },
  {
    id: 'RFCW99887766',
    platform: 'android',
    type: 'usb',
    model: 'Pixel 7',
    product: 'panther',
    isAuthorized: false,
    rawStatus: 'unauthorized',
  },
];
