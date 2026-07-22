/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    serverMinification: false,
  },

  // output: "standalone",

  swcMinify: true,

  modularizeImports: {
    "@mui/icons-material": {
      transform: "@mui/icons-material/{{member}}",
    },
  },

  images: {
    remotePatterns: [
      // =====================================================
      // LOCAL BACKEND IMAGES
      // =====================================================
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/images/**",
      },

      // =====================================================
      // CLOUDINARY IMAGES
      // =====================================================
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/eybmkz9z/**",
      },
    ],
  },
};

module.exports = nextConfig;
