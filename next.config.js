/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig