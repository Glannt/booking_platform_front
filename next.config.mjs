/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_API || "http://localhost:8080";
    return [
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/gioi-thieu-minh-khoa-travel",
        destination: "/vi/about",
        permanent: true,
      },
      {
        source: "/thue-xe-di-tinh",
        destination: "/vi/rent-car",
        permanent: true,
      },
      {
        source: "/thue-xe-tu-lai-nha-trang",
        destination: "/vi/self-drive",
        permanent: true,
      },
      {
        source: "/korean/tour-nha-trang-mui-ne-private-car",
        destination: "/ko/tours",
        permanent: true,
      },
      {
        source: "/korean/tour-nha-trang-da-lat-private-car",
        destination: "/ko/tours",
        permanent: true,
      },
      {
        source: "/korean/cam-ranh-airport-transfer",
        destination: "/ko/airport-transfer",
        permanent: true,
      },
      {
        source: "/en/airport-transfer-cam-ranh",
        destination: "/en/airport-transfer",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
