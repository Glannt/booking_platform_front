import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://booking.minhkhoatravel.vn"),
  title: {
    default: "Minh Khoa Travel | Đặt Xe & Tour Du Lịch Nha Trang",
    template: "%s | Minh Khoa Travel",
  },
  description: siteConfig.description,
  keywords: [
    "Minh Khoa Travel",
    "thuê xe Nha Trang",
    "đưa đón sân bay Cam Ranh",
    "thuê xe tự lái Nha Trang",
    "thuê xe đi tỉnh Nha Trang",
    "tour du lịch Nha Trang",
    "Nha Trang airport transfer",
    "Nha Trang car rental",
  ],
  authors: [{ name: "Minh Khoa Travel" }],
  creator: "Minh Khoa Travel",
  publisher: "Minh Khoa Travel",
  alternates: {
    canonical: "https://booking.minhkhoatravel.vn",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://booking.minhkhoatravel.vn",
    siteName: "Minh Khoa Travel",
    title: "Minh Khoa Travel | Đặt Xe & Tour Du Lịch Nha Trang",
    description: siteConfig.description,
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Minh Khoa Travel Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Minh Khoa Travel | Đặt Xe & Tour Du Lịch Nha Trang",
    description: siteConfig.description,
    images: ["/icon-512x512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    bingbot: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    applebot: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    coccocbot: "index, follow, max-snippet:-1, max-image-preview:large",
    duckduckbot: "index, follow",
    yandex: "index, follow",
    "msapplication-TileColor": "#09090b",
    "msapplication-TileImage": "/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "TravelAgency",
      "@id": "https://booking.minhkhoatravel.vn/#organization",
      "name": "Minh Khoa Travel",
      "alternateName": ["Minh Khoa Travel Nha Trang", "Thuê Xe Minh Khoa Travel"],
      "url": "https://booking.minhkhoatravel.vn",
      "logo": "https://booking.minhkhoatravel.vn/icon-512x512.png",
      "image": "https://booking.minhkhoatravel.vn/icon-512x512.png",
      "description": siteConfig.description,
      "sameAs": ["https://minhkhoatravel.vn"],
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Nha Trang",
        "addressRegion": "Khánh Hòa",
        "addressCountry": "VN",
      },
      "priceRange": "$$",
    },
    {
      "@type": "WebSite",
      "@id": "https://booking.minhkhoatravel.vn/#website",
      "url": "https://booking.minhkhoatravel.vn",
      "name": "Minh Khoa Travel",
      "publisher": {
        "@id": "https://booking.minhkhoatravel.vn/#organization",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="vi">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <div className="relative flex flex-col min-h-screen">
            <main className="w-full flex-grow">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
