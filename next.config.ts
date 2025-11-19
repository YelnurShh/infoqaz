/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // 🟡 ⬅️ Міне осы жолды қосу керек
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        port: "",
        pathname: "/**",
      },
      // қосымша домендер керек болса осында қосыңыз
    ],
  },
};

module.exports = nextConfig;
