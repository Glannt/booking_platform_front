"use client";

import { useI18n } from "@/context/LanguageContext";
import Link from "next/link";

export const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="w-full bg-slate-50 dark:bg-[var(--bg-page)] text-slate-600 dark:text-slate-400 py-16 border-t border-slate-200 dark:border-slate-900 transition-colors">
      <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 grid grid-cols-1 md:grid-cols-12 gap-10">

        {/* Col 1 – Brand & Company Info */}
        <div className="md:col-span-4 space-y-4">
          <a
            href="https://minhkhoatravel.vn"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 no-underline"
          >
            <img
              src="https://minhkhoatravel.vn/wp-content/uploads/2025/05/logo_header_150x150.png"
              alt="Minh Khoa Travel"
              className="w-10 h-10 object-contain rounded-xl"
            />
            <span className="text-slate-900 dark:text-white font-extrabold text-base leading-tight">
              Minh Khoa Travel
            </span>
          </a>

          <p className="text-xs leading-relaxed">
            {t.footer.description}
          </p>

          <ul className="space-y-1.5 text-xs list-none p-0 m-0">
            <li className="flex items-start gap-1.5">
              <span className="text-slate-400 dark:text-slate-500 mt-px">🏢</span>
              {t.footer.companyLegalName}
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-slate-400 dark:text-slate-500 mt-px">📍</span>
              {t.footer.address}
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-slate-400 dark:text-slate-500 mt-px">🔖</span>
              {t.footer.taxId}
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-slate-400 dark:text-slate-500 mt-px">📞</span>
              <a href="tel:0764971971" className="hover:text-slate-900 dark:hover:text-white transition-colors no-underline">
                {t.footer.hotline}: {t.footer.phone}
              </a>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-slate-400 dark:text-slate-500 mt-px">🌐</span>
              <a
                href="https://minhkhoatravel.vn"
                target="_blank"
                rel="noreferrer"
                className="hover:text-slate-900 dark:hover:text-white transition-colors no-underline"
              >
                minhkhoatravel.vn
              </a>
            </li>
          </ul>

          {/* Bộ Công Thương Badge */}
          <a
            href="http://online.gov.vn/Home/WebDetails/136691?AspxAutoDetectCookieSupport=1"
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-1"
            aria-label="Đã thông báo Bộ Công Thương"
          >
            <img
              src="https://minhkhoatravel.vn/wp-content/uploads/2025/10/logo-da-thong-bao-bo-cong-thuong.png"
              alt="Đã thông báo Bộ Công Thương"
              className="h-10 object-contain opacity-90 hover:opacity-100 transition-opacity"
            />
          </a>
        </div>

        {/* Col 2 – Company */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="text-slate-900 dark:text-white font-extrabold text-xs uppercase tracking-wider">
            {t.footer.company}
          </h4>
          <ul className="space-y-2 text-xs list-none p-0 m-0">
            <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors no-underline">{t.footer.aboutUs}</Link></li>
            <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors no-underline">{t.footer.partner}</Link></li>
            <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors no-underline">{t.footer.careers}</Link></li>
          </ul>
        </div>

        {/* Col 3 – Services */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="text-slate-900 dark:text-white font-extrabold text-xs uppercase tracking-wider">
            {t.footer.services}
          </h4>
          <ul className="space-y-2 text-xs list-none p-0 m-0">
            <li>
              <Link href="/airport-transfer" className="hover:text-slate-900 dark:hover:text-white transition-colors no-underline">
                {t.footer.airportTransfer}
              </Link>
            </li>
            <li>
              <Link href="/intercity" className="hover:text-slate-900 dark:hover:text-white transition-colors no-underline">
                {t.footer.rentCar}
              </Link>
            </li>
            <li>
              <Link href="/self-drive" className="hover:text-slate-900 dark:hover:text-white transition-colors no-underline">
                {t.footer.selfDrive}
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors no-underline">
                {t.footer.tour}
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4 – Support */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="text-slate-900 dark:text-white font-extrabold text-xs uppercase tracking-wider">
            {t.footer.support}
          </h4>
          <ul className="space-y-2 text-xs list-none p-0 m-0">
            <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors no-underline">{t.footer.helpCenter}</Link></li>
            <li><a href="tel:0764971971" className="hover:text-slate-900 dark:hover:text-white transition-colors no-underline">{t.footer.contactUs}</a></li>
            <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors no-underline">{t.footer.refundPolicy}</Link></li>
          </ul>
        </div>

        {/* Col 5 – Legal */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="text-slate-900 dark:text-white font-extrabold text-xs uppercase tracking-wider">
            {t.footer.legal}
          </h4>
          <ul className="space-y-2 text-xs list-none p-0 m-0">
            <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors no-underline">{t.footer.termsOfService}</Link></li>
            <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors no-underline">{t.footer.privacyPolicy}</Link></li>
            <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors no-underline">{t.footer.operatingRegulations}</Link></li>
          </ul>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 border-t border-slate-200 dark:border-slate-900 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 gap-4 transition-colors">
        <span>&copy; {new Date().getFullYear()} {t.footer.copyright}</span>
        <span>{t.footer.companyFooter}</span>
        <span>Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600 dark:hover:text-slate-300">OpenStreetMap</a> contributors</span>
      </div>
    </footer>
  );
};
