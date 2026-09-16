export const ADB_COMMANDS = {
  DEVICES: ['devices', '-l'],
  SCREENCAP: ['exec-out', 'screencap', '-p'],
  TCP_IP: (port: number) => ['tcpip', port.toString()],
  CONNECT: (ip: string, port: number) => ['connect', `${ip}:${port}`],
  PAIR: (ip: string, port: number, code: string) => ['pair', `${ip}:${port}`, code],
  WLAN_IP: ['shell', 'ip', '-f', 'inet', 'addr', 'show', 'wlan0'],
  FOREGROUND_APP: ['shell', 'dumpsys', 'window'],
  FORCE_STOP: (pkg: string) => ['shell', 'am', 'force-stop', pkg],
  CLEAR_APP: (pkg: string) => ['shell', 'pm', 'clear', pkg],
  LAUNCH_APP: (pkg: string) => ['shell', 'monkey', '-p', pkg, '-c', 'android.intent.category.LAUNCHER', '1'],
  UIAUTOMATOR_DUMP: ['exec-out', 'uiautomator', 'dump', '/dev/tty'],
  INPUT_TAP: (x: number, y: number) => ['shell', 'input', 'tap', x.toString(), y.toString()],
  INPUT_TEXT: (escapedText: string) => ['shell', 'input', 'text', escapedText],
  INPUT_KEY: (keyCode: number | string) => ['shell', 'input', 'keyevent', keyCode.toString()],
  INPUT_SWIPE: (x1: number, y1: number, x2: number, y2: number, durationMs: number = 300) => [
    'shell', 'input', 'swipe', x1.toString(), y1.toString(), x2.toString(), y2.toString(), durationMs.toString()
  ],
} as const;
