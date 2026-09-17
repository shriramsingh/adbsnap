import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ADBSnap Studio',
    short_name: 'ADBSnap',
    description: 'Automated mobile screenshot capture, 4K device framing & animated product story studio',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0b0e',
    theme_color: '#0a0b0e',
    icons: [
      {
        src: '/icon.png',
        sizes: '128x128',
        type: 'image/png',
      },
    ],
  };
}
