/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // IMPORTANTE: Esto optimiza el build para entornos de servidor como Cloud Functions
  output: 'standalone', 
  // Permitimos que Firebase maneje la compresión
  compress: false,
  experimental: {
    // Esto ayuda a que las funciones encuentren las dependencias correctamente
    externalDir: true,
  },
};

module.exports = nextConfig;
