import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.vercel.storage',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', 
      allowedOrigins: [
        'http://localhost:3000',
        '*.replit.com',
        '*.replit.dev',
        '*.vercel.app',
        '*.vercel.com',
        '*.vercel.dev',
        '*.spock.replit.dev',
        '*.spock.replit.dev:3000'
      ]
    },
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src')
    return config
  },
}

export default nextConfig
