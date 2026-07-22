/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SQLite usa el módulo integrado de Node (node:sqlite). Next externaliza
  // los builtins con prefijo "node:" automáticamente — no requiere config nativa.
};

export default nextConfig;
