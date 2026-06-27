"use client";

import { useI18n } from "@/context/LanguageContext";
import Link from "next/link";

export const Footer = () => {
  const { language } = useI18n();
  const vi = language === "vi";

  return (
    <footer className="w-full bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10">

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
            <span className="text-white font-extrabold text-base leading-tight">
              Minh Khoa Travel
            </span>
          </a>

          <p className="text-xs leading-relaxed">
            {vi
              ? "Cung cấp dịch vụ vận chuyển hành khách uy tín, chất lượng hàng đầu Việt Nam."
              : "Trusted, top-quality passenger transport services across Vietnam."}
          </p>

          <ul className="space-y-1.5 text-xs list-none p-0 m-0">
            <li className="flex items-start gap-1.5">
              <span className="text-slate-500 mt-px">🏢</span>
              Công Ty TNHH Minh Khoa Travel
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-slate-500 mt-px">📍</span>
              18 Thủy Xưởng, Tây Nha Trang, Khánh Hòa
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-slate-500 mt-px">🔖</span>
              MST: 4201980860
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-slate-500 mt-px">📞</span>
              <a href="tel:0764971971" className="hover:text-white transition-colors no-underline">
                Hotline: 0764 971 971
              </a>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-slate-500 mt-px">🌐</span>
              <a
                href="https://minhkhoatravel.vn"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors no-underline"
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
          <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">
            {vi ? "Công ty" : "Company"}
          </h4>
          <ul className="space-y-2 text-xs list-none p-0 m-0">
            <li><Link href="#" className="hover:text-white transition-colors no-underline">Về chúng tôi</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors no-underline">Đối tác</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors no-underline">Tuyển dụng</Link></li>
          </ul>
        </div>

        {/* Col 3 – Services */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">
            {vi ? "Dịch vụ" : "Services"}
          </h4>
          <ul className="space-y-2 text-xs list-none p-0 m-0">
            <li>
              <Link href="/airport-transfer" className="hover:text-white transition-colors no-underline">
                {vi ? "Đưa đón sân bay" : "Airport Transfer"}
              </Link>
            </li>
            <li>
              <Link href="/rent-car" className="hover:text-white transition-colors no-underline">
                {vi ? "Thuê xe đi tỉnh" : "Provincial Transfers"}
              </Link>
            </li>
            <li>
              <Link href="/self-drive" className="hover:text-white transition-colors no-underline">
                {vi ? "Thuê xe tự lái" : "Self-Drive Rental"}
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white transition-colors no-underline">
                {vi ? "Xe tham quan du lịch" : "Sightseeing Tours"}
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4 – Support */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">
            {vi ? "Hỗ trợ" : "Support"}
          </h4>
          <ul className="space-y-2 text-xs list-none p-0 m-0">
            <li><Link href="#" className="hover:text-white transition-colors no-underline">Trung tâm trợ giúp</Link></li>
            <li><a href="tel:0764971971" className="hover:text-white transition-colors no-underline">Liên hệ</a></li>
            <li><Link href="#" className="hover:text-white transition-colors no-underline">Chính sách hoàn tiền</Link></li>
          </ul>
        </div>

        {/* Col 5 – Legal */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">
            {vi ? "Pháp lý" : "Legal"}
          </h4>
          <ul className="space-y-2 text-xs list-none p-0 m-0">
            <li><Link href="#" className="hover:text-white transition-colors no-underline">Điều khoản dịch vụ</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors no-underline">Chính sách bảo mật</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors no-underline">Quy chế hoạt động</Link></li>
          </ul>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-6 border-t border-slate-900 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
        <span>&copy; {new Date().getFullYear()} Minh Khoa Travel. All rights reserved.</span>
        <span>Công Ty TNHH Minh Khoa Travel – MST: 4201980860</span>
      </div>
    </footer>
  );
};
