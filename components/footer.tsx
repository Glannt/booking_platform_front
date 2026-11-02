"use client";

import { useI18n } from "@/context/LanguageContext";
import Link from "next/link";

const linkClass =
  "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors no-underline";

const headingClass =
  "text-slate-900 dark:text-white font-extrabold text-[11px] uppercase tracking-[0.14em] pb-3 mb-4 border-b border-slate-200 dark:border-slate-800";

export const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="w-full bg-slate-50 dark:bg-[var(--bg-page)] text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-900 transition-colors">
      <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Top: brand + hotline */}
        <div className="py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8 border-b border-slate-200 dark:border-slate-900">
          <a
            href="https://minhkhoatravel.vn"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 no-underline w-fit"
          >
            <img
              src="https://minhkhoatravel.vn/wp-content/uploads/2025/05/logo_header_150x150.png"
              alt="Minh Khoa Travel"
              className="w-12 h-12 object-contain rounded-xl"
            />
            <span className="text-slate-900 dark:text-white font-extrabold text-lg leading-tight">
              Minh Khoa Travel
            </span>
          </a>

          <a
            href="tel:0764971971"
            className="group flex flex-col md:items-end no-underline w-fit"
          >
            <span className="text-[11px] uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              {t.footer.hotline}
            </span>
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:opacity-80 transition-opacity">
              {t.footer.phone}
            </span>
          </a>
        </div>

        {/* Middle: info + link columns */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Company info */}
          <div className="md:col-span-5 space-y-6">
            <p className="text-sm leading-relaxed max-w-md">
              {t.footer.description}
            </p>

            <div className="space-y-1.5 text-xs leading-relaxed border-l-2 border-slate-300 dark:border-slate-700 pl-4">
              <p className="text-slate-900 dark:text-white font-bold m-0">
                {t.footer.companyLegalName}
              </p>
              <p className="m-0">{t.footer.address}</p>
              <p className="m-0">{t.footer.taxId}</p>
              <p className="m-0">
                <a
                  href="https://minhkhoatravel.vn"
                  target="_blank"
                  rel="noreferrer"
                  className={`${linkClass} underline underline-offset-4`}
                >
                  minhkhoatravel.vn
                </a>
              </p>
            </div>

            {/* Bộ Công Thương Badge */}
            <a
              href="http://online.gov.vn/Home/WebDetails/136691?AspxAutoDetectCookieSupport=1"
              target="_blank"
              rel="noreferrer"
              className="inline-block"
              aria-label="Đã thông báo Bộ Công Thương"
            >
              <img
                src="https://minhkhoatravel.vn/wp-content/uploads/2025/10/logo-da-thong-bao-bo-cong-thuong.png"
                alt="Đã thông báo Bộ Công Thương"
                className="h-10 object-contain opacity-90 hover:opacity-100 transition-opacity"
              />
            </a>
          </div>

          {/* Links */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-10">
            <div>
              <h4 className={headingClass}>{t.footer.company}</h4>
              <ul className="space-y-2.5 text-xs list-none p-0 m-0">
                <li><Link href="#" className={linkClass}>{t.footer.aboutUs}</Link></li>
                <li><Link href="#" className={linkClass}>{t.footer.partner}</Link></li>
                <li><Link href="#" className={linkClass}>{t.footer.careers}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className={headingClass}>{t.footer.services}</h4>
              <ul className="space-y-2.5 text-xs list-none p-0 m-0">
                <li><Link href="/airport-transfer" className={linkClass}>{t.footer.airportTransfer}</Link></li>
                <li><Link href="/intercity" className={linkClass}>{t.footer.rentCar}</Link></li>
                <li><Link href="/self-drive" className={linkClass}>{t.footer.selfDrive}</Link></li>
                <li><Link href="#" className={linkClass}>{t.footer.tour}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className={headingClass}>{t.footer.support}</h4>
              <ul className="space-y-2.5 text-xs list-none p-0 m-0">
                <li><Link href="#" className={linkClass}>{t.footer.helpCenter}</Link></li>
                <li><a href="tel:0764971971" className={linkClass}>{t.footer.contactUs}</a></li>
                <li><Link href="#" className={linkClass}>{t.footer.refundPolicy}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className={headingClass}>{t.footer.legal}</h4>
              <ul className="space-y-2.5 text-xs list-none p-0 m-0">
                <li><Link href="#" className={linkClass}>{t.footer.termsOfService}</Link></li>
                <li><Link href="#" className={linkClass}>{t.footer.privacyPolicy}</Link></li>
                <li><Link href="#" className={linkClass}>{t.footer.operatingRegulations}</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Credit / portfolio ad */}
        <div className="border-t border-slate-200 dark:border-slate-900 py-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px] text-foreground/50 transition-colors">
          <span>{t.footer.creditPrefix}</span>
          <span className="hidden sm:inline">·</span>
          <span>
            {t.footer.creditPhoneLabel}:{" "}
            <a
              href="tel:0368761064"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              0368761064
            </a>
          </span>
          <span className="hidden sm:inline">·</span>
          <a
            href="mailto:tongnguyenthanhdo@gmail.com"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            tongnguyenthanhdo@gmail.com
          </a>
          <span className="hidden sm:inline">·</span>
          <span>{t.footer.creditCta}</span>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-200 dark:border-slate-900 py-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 gap-3 transition-colors">
          <span>&copy; {new Date().getFullYear()} {t.footer.copyright}</span>
          <span>{t.footer.companyFooter}</span>
          <span>
            Map data &copy;{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-600 dark:hover:text-slate-300"
            >
              OpenStreetMap
            </a>{" "}
            contributors
          </span>
        </div>
      </div>
    </footer>
  );
};