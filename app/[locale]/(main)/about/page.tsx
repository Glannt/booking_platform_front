import { Metadata } from "next";
import Image from "next/image";
import { translations } from "@/config/translations";
import { Building2, User, FileText, MapPin, Phone, Mail, Globe, ShieldCheck, Handshake, Clock, Car, Plane } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale || "vi";
  const t = translations[locale as "vi" | "en" | "ko" | "ru"] || translations.vi;
  return {
    title: `${t.nav.about} | Minh Khoa Travel`,
    description: t.aboutPage.introDesc,
    openGraph: {
      title: `${t.nav.about} | Minh Khoa Travel`,
      description: t.aboutPage.introDesc,
      type: "website",
    }
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale || "vi";
  const t = translations[locale as "vi" | "en" | "ko" | "ru"] || translations.vi;
  const ap = t.aboutPage;

  return (
    <div className="space-y-12">
      {/* Banner / Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-8 md:p-12 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="text-blue-300 font-bold uppercase tracking-wider text-sm">Minh Khoa Travel</span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{ap.introTitle}</h1>
          <p className="text-lg text-blue-100/90 leading-relaxed font-light">{ap.introDesc}</p>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Website Owner Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-content1 border border-default-200/50 rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-bold border-b pb-3 border-default-100 flex items-center gap-2">
              <Building2 className="text-primary" size={20} />
              {ap.ownerTitle}
            </h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Building2 className="text-default-400 mt-1 flex-shrink-0" size={16} />
                <div>
                  <p className="text-xs text-default-400 uppercase tracking-wider font-semibold">{ap.companyNameLabel}</p>
                  <p className="text-sm font-semibold">{ap.companyNameValue}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <FileText className="text-default-400 mt-1 flex-shrink-0" size={16} />
                <div>
                  <p className="text-xs text-default-400 uppercase tracking-wider font-semibold">{ap.taxCodeLabel}</p>
                  <p className="text-sm font-medium">{ap.taxCodeValue}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <User className="text-default-400 mt-1 flex-shrink-0" size={16} />
                <div>
                  <p className="text-xs text-default-400 uppercase tracking-wider font-semibold">{ap.representativeLabel}</p>
                  <p className="text-sm font-medium">{ap.representativeValue}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="text-default-400 mt-1 flex-shrink-0" size={16} />
                <div>
                  <p className="text-xs text-default-400 uppercase tracking-wider font-semibold">{ap.addressLabel}</p>
                  <p className="text-sm font-medium leading-relaxed">{ap.addressValue}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="text-default-400 mt-1 flex-shrink-0" size={16} />
                <div>
                  <p className="text-xs text-default-400 uppercase tracking-wider font-semibold">{ap.phoneLabel}</p>
                  <p className="text-sm font-medium">{ap.phoneValue}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Mail className="text-default-400 mt-1 flex-shrink-0" size={16} />
                <div>
                  <p className="text-xs text-default-400 uppercase tracking-wider font-semibold">{ap.emailLabel}</p>
                  <p className="text-sm font-medium">{ap.emailValue}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Globe className="text-default-400 mt-1 flex-shrink-0" size={16} />
                <div>
                  <p className="text-xs text-default-400 uppercase tracking-wider font-semibold">{ap.websiteLabel}</p>
                  <a href={ap.websiteValue} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">{ap.websiteValue}</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mission, Featured Services */}
        <div className="lg:col-span-2 space-y-8">
          {/* Mission & Values */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="text-success" size={24} />
              {ap.missionTitle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-content2 border border-default-100 p-5 rounded-xl space-y-2 flex flex-col justify-between">
                <Clock className="text-primary" size={20} />
                <p className="text-sm font-semibold">{ap.mission1}</p>
              </div>
              <div className="bg-content2 border border-default-100 p-5 rounded-xl space-y-2 flex flex-col justify-between">
                <ShieldCheck className="text-success" size={20} />
                <p className="text-sm font-semibold">{ap.mission2}</p>
              </div>
              <div className="bg-content2 border border-default-100 p-5 rounded-xl space-y-2 flex flex-col justify-between">
                <Handshake className="text-warning" size={20} />
                <p className="text-sm font-semibold">{ap.mission3}</p>
              </div>
            </div>
          </div>

          {/* Featured Services */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{ap.servicesTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-content1 border border-default-200/50 p-5 rounded-xl space-y-3 hover:border-primary/50 transition-colors">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg w-fit">
                  <Plane size={20} />
                </div>
                <h3 className="font-bold text-base">{ap.service1Title}</h3>
                <p className="text-xs text-default-500 leading-relaxed">{ap.service1Desc}</p>
              </div>
              <div className="bg-content1 border border-default-200/50 p-5 rounded-xl space-y-3 hover:border-primary/50 transition-colors">
                <div className="p-3 bg-green-500/10 text-green-500 rounded-lg w-fit">
                  <Car size={20} />
                </div>
                <h3 className="font-bold text-base">{ap.service2Title}</h3>
                <p className="text-xs text-default-500 leading-relaxed">{ap.service2Desc}</p>
              </div>
              <div className="bg-content1 border border-default-200/50 p-5 rounded-xl space-y-3 hover:border-primary/50 transition-colors">
                <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg w-fit">
                  <Car size={20} />
                </div>
                <h3 className="font-bold text-base">{ap.service3Title}</h3>
                <p className="text-xs text-default-500 leading-relaxed">{ap.service3Desc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Section: International Partner */}
      <div className="bg-content1 border border-default-200/50 rounded-2xl p-6 md:p-8 shadow-sm space-y-8">
        <div className="max-w-3xl space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="text-primary animate-pulse" size={24} />
            {ap.partnerTitle}
          </h2>
          <p className="text-sm text-default-500 leading-relaxed">{ap.partnerDesc}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-4 border-t border-default-100">
          <div className="flex flex-col items-center justify-center p-6 bg-content2 rounded-xl border border-default-100 gap-4">
            <div className="relative w-48 h-20">
              <Image
                src="/Welcome_logo.webp.png"
                alt={ap.partnerLogoAlt}
                fill
                className="object-contain dark:brightness-125"
              />
            </div>
            <p className="text-xs font-semibold text-default-500">{ap.partnerLogoAlt}</p>
          </div>

          <div className="flex flex-col items-center justify-center p-6 bg-content2 rounded-xl border border-default-100 gap-4">
            <div className="relative w-full max-w-sm aspect-[4/3] rounded-lg overflow-hidden border border-default-200 shadow-sm bg-white p-2">
              <Image
                src="/chu-ki-doi-tac.png"
                alt={ap.partnerSignatureTitle}
                fill
                className="object-contain"
              />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold">{ap.partnerSignatureTitle}</h4>
              <p className="text-xs text-default-400 max-w-xs">{ap.partnerSignatureDesc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commitment & Quick Contacts */}
      <div className="bg-gradient-to-r from-default-100 to-default-50/50 border border-default-200/50 rounded-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 space-y-2">
          <h2 className="text-xl font-bold">{ap.commitmentTitle}</h2>
          <p className="text-sm text-default-500 leading-relaxed">{ap.commitmentDesc}</p>
        </div>
        <div className="bg-content1 border border-default-200/50 p-5 rounded-xl space-y-3">
          <h3 className="font-bold text-sm border-b pb-2 border-default-100">{ap.contactTitle}</h3>
          <div className="space-y-2 text-xs">
            <p className="flex justify-between"><span className="text-default-400">Website:</span> <a href="https://minhkhoatravel.vn" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">https://minhkhoatravel.vn</a></p>
            <p className="flex justify-between"><span className="text-default-400">Hotline/Zalo:</span> <span className="font-medium">0764 971 971</span></p>
            <p className="flex justify-between"><span className="text-default-400">{ap.contactKakaoLabel}:</span> <span className="font-medium">{ap.contactKakaoValue}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
