import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
        // This is a workaround for a bug in Genkit with Next.js app router.
        // It prevents the build from failing due to a module not found error.
        config.externals.push({
            './context-caching': 'var {}',
        });
    }
    return config;
  }
};

export default nextConfig;
