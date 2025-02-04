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
    serverActions: true,
  },
}

module.exports = nextConfig