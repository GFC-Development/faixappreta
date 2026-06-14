/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: [
      "@libsql/client",
      "@prisma/adapter-libsql",
      "@prisma/adapter-better-sqlite3",
      "better-sqlite3",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/faixappreta-uploads/**",
      },
    ],
  },
};

export default nextConfig;
