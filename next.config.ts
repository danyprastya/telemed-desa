import type { NextConfig } from 'next'

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

const nextConfig: NextConfig = {
  // Allow Supabase domain for any future image loading
  images: {
    remotePatterns: [],
  },
}

module.exports = withPWA(nextConfig)
