/** @type {import('next').NextConfig} */
const API_HOST = process.env.API_HOST || 'http://192.168.0.67:3001';

const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_HOST: API_HOST,
  },
};

export default nextConfig;