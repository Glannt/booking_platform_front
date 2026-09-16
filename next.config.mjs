/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:8080";
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
        destination: "/vi/intercity",
        permanent: true,
      },
      {
        source: "/:locale(vi|en|ko|ru)/rent-car/:path*",
        destination: "/:locale/intercity/:path*",
        permanent: true,
      },
      {
        source: "/:locale(vi|en|ko|ru)/rent-car",
        destination: "/:locale/intercity",
        permanent: true,
      },
      {
        source: "/rent-car/:path*",
        destination: "/vi/intercity/:path*",
        permanent: true,
      },
      {
        source: "/rent-car",
        destination: "/vi/intercity",
        permanent: true,
      },
      {
        source: "/thue-xe-tu-lai-nha-trang",
        destination: "/vi/self-drive",
        permanent: true,
      },
      {
        source: "/xe-dua-don-san-bay-cam-ranh",
        destination: "/vi/airport-transfer",
        permanent: true,
      },
      {
        source: "/xe-nha-trang-di-da-lat",
        destination: "/vi/intercity/xe-nha-trang-di-da-lat",
        permanent: true,
      },
      {
        source: "/tour-3-dao-nha-trang",
        destination: "/vi/tours/tour-3-dao-nha-trang-vip",
        permanent: true,
      },
      {
        source: "/tour-noi-thanh-nha-trang",
        destination: "/vi/tours",
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
