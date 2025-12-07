/** @type {import('next').NextConfig} */
const path = require("path");
const server="https://paint-backend.smartyalta.ru/"
const nextConfig = {
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: `${server}/:path*/`,
      },
    ]
  },
}

module.exports = nextConfig
