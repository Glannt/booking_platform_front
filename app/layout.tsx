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
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.png",
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
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Minh Khoa Travel Logo",
      },
    ],
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
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
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
