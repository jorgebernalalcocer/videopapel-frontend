/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ❗ Permite que el build de producción termine
    // aunque haya errores de TypeScript
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
