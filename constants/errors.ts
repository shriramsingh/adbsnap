export const ERROR_CODES = {
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  DEVICE_UNAUTHORIZED: 'DEVICE_UNAUTHORIZED',
  ADB_NOT_FOUND: 'ADB_NOT_FOUND',
  CAPTURE_FAILED: 'CAPTURE_FAILED',
  WIFI_CONNECT_FAILED: 'WIFI_CONNECT_FAILED',
  COMPOSITE_FAILED: 'COMPOSITE_FAILED',
  INVALID_COMMAND: 'INVALID_COMMAND',
  CRITICAL_ERROR: 'CRITICAL_ERROR',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export const ERROR_MESSAGES: Record<ErrorCode, { message: string; tip: string }> = {
  DEVICE_NOT_FOUND: {
    message: 'No Android device detected.',
    tip: 'Please plug in your phone via USB with USB Debugging enabled, or run adbsnap wifi <ip>.',
  },
  DEVICE_UNAUTHORIZED: {
    message: 'Device is connected but unauthorized.',
    tip: 'Unlock your phone screen and tap "Always allow from this computer" on the USB Debugging prompt.',
  },
  ADB_NOT_FOUND: {
    message: 'ADB executable not found in system PATH.',
    tip: 'Install Android Platform Tools and ensure adb.exe is accessible in PATH.',
  },
  CAPTURE_FAILED: {
    message: 'Failed to capture screenshot stream from device.',
    tip: 'Ensure your phone screen is unlocked and not in deep sleep.',
  },
  WIFI_CONNECT_FAILED: {
    message: 'Failed to establish wireless ADB connection.',
    tip: 'Check that both your computer and phone are connected to the exact same Wi-Fi network.',
  },
  COMPOSITE_FAILED: {
    message: 'Failed to composite screenshot frame.',
    tip: 'Check that Sharp has valid input image buffers and SVG templates.',
  },
  INVALID_COMMAND: {
    message: 'Unknown or unrecognized command specified.',
    tip: 'Run "adbsnap help" to view all available commands and flags.',
  },
  CRITICAL_ERROR: {
    message: 'An unexpected critical error occurred.',
    tip: 'Check terminal logs and device connection state.',
  },
};

