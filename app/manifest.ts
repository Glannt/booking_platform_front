import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Minh Khoa Travel | Đặt Xe & Tour Du Lịch Nha Trang",
    short_name: "Minh Khoa Travel",
    description:
      "Minh Khoa Travel - Dịch vụ xe du lịch, thuê xe tự lái & có tài xế, đưa đón sân bay Cam Ranh chuyên nghiệp tại Nha Trang.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
