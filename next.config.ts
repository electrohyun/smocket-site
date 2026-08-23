import type { NextConfig } from 'next';

const useSmocket = process.env.DEMO_SOCKET_TARGET !== 'real';

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: useSmocket
      ? {
          'socket.io-client': 'smocket-client',
        }
      : {},
  },
  webpack(config) {
    if (useSmocket) config.resolve.alias['socket.io-client'] = 'smocket-client';
    return config;
  },
};

export default nextConfig;
