import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp', 'archiver'],
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  webpack: (config) => {
    const parentModules = path.resolve(__dirname, '..');
    const localModules = path.resolve(__dirname, 'node_modules');

    config.resolveLoader = config.resolveLoader || {};
    config.resolveLoader.modules = [
      localModules,
      parentModules,
      'node_modules',
      ...(config.resolveLoader.modules || []),
    ];

    config.resolve = config.resolve || {};
    config.resolve.modules = [
      localModules,
      parentModules,
      'node_modules',
      ...(config.resolve.modules || []),
    ];

    return config;
  },
};

export default nextConfig;
