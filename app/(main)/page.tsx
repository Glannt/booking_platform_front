"use client";
import { useRef, useState, useEffect } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Star,
  ShieldCheck,
  UserCheck,
  Car,
  Headset,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  ChevronUp,
  Minus,
  Plus,
  Phone,
  MessageCircle
} from "lucide-react";
import { Button } from "@heroui/react";
import { useI18n } from "@/context/LanguageContext";

const InstagramIcon = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const homeTranslations = {
  vi: {
    heroTitle: "Đến nơi. Khám phá. Trải nghiệm.",
    heroSubtitle: "Dịch vụ vận chuyển thiết kế riêng cho mỗi hành trình.",
    pickupPlaceholder: "Điểm đón (Sân bay, cảng, địa chỉ)",
    destPlaceholder: "Điểm đến (Sân bay, cảng, địa chỉ)",
    dateLabel: "Ngày đón",
    searchBtn: "Tiếp tục",
    oneWay: "Một chiều",
    returnTrip: "Khứ hồi",
    passengers: "Hành khách",
    luggage: "Hành lý",
    statsLabel: "22.824 hành khách tại 346 điểm đến đã đặt xe hôm nay",

    featuresTitle: "Tại sao chọn TravelGo?",
    feature1Title: "Thanh toán An toàn",
    feature1Desc: "Thanh toán online bảo mật, xác nhận chuyến đi ngay lập tức.",
    feature2Title: "Tài xế Chuyên nghiệp",
    feature2Desc: "Đội ngũ lái xe giàu kinh nghiệm, lịch sự và nói tiếng Anh.",
    feature3Title: "Xe Đời mới hiện đại",
    feature3Desc: "Đa dạng dòng xe từ 4-45 chỗ, sạch sẽ và tiện nghi.",
    feature4Title: "Hỗ trợ 24/7",
    feature4Desc: "Luôn sẵn sàng hỗ trợ bạn trên mọi hành trình của mình.",

    popularTitle: "Chuyến đi phổ biến & Tour du lịch",
    popularSubtitle: "Khám phá những tuyến đường được khách du lịch lựa chọn nhiều nhất.",
    bookNow: "Đặt ngay",
    viewAll: "Xem tất cả",

    lovedTitle: "Được khách hàng tin yêu",
    lovedSubtitle: "Đọc đánh giá thực tế từ hàng ngàn hành khách đã trải nghiệm dịch vụ của chúng tôi.",

    inspirationTitle: "Cẩm hứng du lịch",
    inspirationSubtitle: "Khám phá những điểm đến tuyệt đẹp và kinh nghiệm du lịch Việt Nam.",
    followUs: "Theo dõi hành trình của chúng tôi",

    ctaTitle: "Sẵn sàng cho một chuyến đi êm ái?",
    ctaSubtitle: "Lên kế hoạch cho hành trình của bạn ngay hôm nay để có trải nghiệm di chuyển không lo âu.",
    ctaBtn: "Đặt chuyến đi ngay",

    footerDesc: "TravelGo mang đến dịch vụ vận chuyển hành khách uy tín, chất lượng hàng đầu Việt Nam.",
    footerCompany: "Công ty",
    footerServices: "Dịch vụ",
    footerSupport: "Hỗ trợ",
    footerLegal: "Pháp lý",
  },
  en: {
    heroTitle: "Arrive. Discover. Experience.",
    heroSubtitle: "Personalised transportation designed for travel.",
    pickupPlaceholder: "From (airport, port, address)",
    destPlaceholder: "To (airport, port, address)",
    dateLabel: "Pickup Date",
    searchBtn: "Continue",
    oneWay: "One Way",
    returnTrip: "Return",
    passengers: "Passengers",
    luggage: "Luggage pieces",
    statsLabel: "22,824 travelers in 346 destinations booked a ride today",

    featuresTitle: "Why Choose TravelGo?",
    feature1Title: "Secure Booking",
    feature1Desc: "Secure online payments and instant confirmation.",
    feature2Title: "Professional Drivers",
    feature2Desc: "Experienced, friendly, and English-speaking drivers.",
    feature3Title: "Modern Fleet",
    feature3Desc: "Well-maintained and comfortable vehicles of all sizes.",
    feature4Title: "24/7 Support",
    feature4Desc: "Always here to help you with your journey.",

    popularTitle: "Popular Transfers & Tours",
    popularSubtitle: "Explore our most popular travel options chosen by other travelers.",
    bookNow: "Book Now",
    viewAll: "View All",

    lovedTitle: "Loved by Travelers",
    lovedSubtitle: "Read real reviews from thousands of passengers who experienced our service.",

    inspirationTitle: "Travel Inspiration",
    inspirationSubtitle: "Discover beautiful destinations and travel tips for your Vietnam adventure.",
    followUs: "Follow our journey",

    ctaTitle: "Ready for a comfortable ride?",
    ctaSubtitle: "Plan your journey with us today and enjoy a hassle-free travel experience.",
    ctaBtn: "Book Your Ride Now",

    footerDesc: "TravelGo provides trusted, top-quality passenger transport services across Vietnam.",
    footerCompany: "Company",
    footerServices: "Services",
    footerSupport: "Support",
    footerLegal: "Legal",
  },
  ko: {
    heroTitle: "도착. 탐험. 체험.",
    heroSubtitle: "각 여정에 맞춤형으로 설계된 전송 서비스.",
    pickupPlaceholder: "출발지 (공항, 항구, 주소)",
    destPlaceholder: "목적지 (공항, 항구, 주소)",
    dateLabel: "인수 날짜",
    searchBtn: "계속하기",
    oneWay: "편도",
    returnTrip: "왕복",
    passengers: "승객",
    luggage: "수하물 개수",
    statsLabel: "오늘 346개 목적지에서 22,824명의 여행객이 차량을 예약했습니다",

    featuresTitle: "왜 TravelGo를 선택해야 할까요?",
    feature1Title: "안전한 예약",
    feature1Desc: "안전한 온라인 결제 및 즉시 확인 서비스.",
    feature2Title: "전문 드라이버",
    feature2Desc: "경험이 풍부하고 친절하며 영어가 가능한 운전사 팀.",
    feature3Title: "현대적인 차량군",
    feature3Desc: "모든 크기의 깨끗하고 쾌적하게 유지 관리된 차량.",
    feature4Title: "24/7 고객 지원",
    feature4Desc: "여정의 모든 단계에서 항상 대기 중인 지원팀.",

    popularTitle: "인기 셔틀 & 투어",
    popularSubtitle: "다른 여행객들이 선택한 가장 인기 있는 여행 경로를 탐색해보세요.",
    bookNow: "지금 예약",
    viewAll: "전체 보기",

    lovedTitle: "여행객이 사랑하는 서비스",
    lovedSubtitle: "저희 서비스를 이용한 수천 명의 승객들의 생생한 리뷰를 읽어보세요.",

    inspirationTitle: "여행 영감",
    inspirationSubtitle: "베트남 모험을 위한 아름다운 목적지와 유용한 여행 팁을 알아보세요.",
    followUs: "저희 여정을 팔로우하세요",

    ctaTitle: "편안한 여정을 떠날 준비가 되셨나요?",
    ctaSubtitle: "오늘 여행을 계획하고 번거로움 없는 여정을 경험해보세요.",
    ctaBtn: "지금 예약하기",

    footerDesc: "TravelGo는 베트남 전역에서 신뢰할 수 있는 최상의 승객 운송 서비스를 제공합니다.",
    footerCompany: "회사",
    footerServices: "서비스",
    footerSupport: "고객 지원",
    footerLegal: "법적 고지",
  },
  ru: {
    heroTitle: "Прибытие. Открытия. Впечатления.",
    heroSubtitle: "Транспортные услуги, созданные индивидуально для каждой поездки.",
    pickupPlaceholder: "Откуда (аэропорт, порт, адрес)",
    destPlaceholder: "Куда (аэропорт, порт, адрес)",
    dateLabel: "Дата поездки",
    searchBtn: "Продолжить",
    oneWay: "В одну сторону",
    returnTrip: "Туда и обратно",
    passengers: "Пассажиры",
    luggage: "Багаж (мест)",
    statsLabel: "Сегодня 22 824 путешественника забронировали поездку в 346 направлениях",

    featuresTitle: "Почему выбирают TravelGo?",
    feature1Title: "Безопасное бронирование",
    feature1Desc: "Безопасные онлайн-платежи и мгновенное подтверждение.",
    feature2Title: "Профессиональные водители",
    feature2Desc: "Опытные, вежливые англоговорящие водители.",
    feature3Title: "Современный автопарк",
    feature3Desc: "Ухоженные и комфортабельные автомобили любых размеров.",
    feature4Title: "Поддержка 24/7",
    feature4Desc: "Мы всегда готовы помочь вам в пути.",

    popularTitle: "Популярные трансферы и туры",
    popularSubtitle: "Исследуйте самые популярные варианты поездок среди других путешественников.",
    bookNow: "Забронировать",
    viewAll: "Показать все",

    lovedTitle: "Любимо путешественниками",
    lovedSubtitle: "Читайте реальные отзывы тысяч пассажиров, оценивших наш сервис.",

    inspirationTitle: "Вдохновение для путешествий",
    inspirationSubtitle: "Откройте для себя красивые места и полезные советы для поездки во Вьетнам.",
    followUs: "Следите за нашими путешествиями",

    ctaTitle: "Готовы к комфортной поездке?",
    ctaSubtitle: "Запланируйте поездку с нами сегодня и наслаждайтесь путешествием без забот.",
    ctaBtn: "Забронировать сейчас",

    footerDesc: "TravelGo предоставляет надежные и высококачественные услуги пассажирских перевозок по всему Вьетнаму.",
    footerCompany: "Компания",
    footerServices: "Услуги",
    footerSupport: "Поддержка",
    footerLegal: "Правовая информация",
  }
};

const popularTours = [
  {
    id: 1,
    title: "Cam Ranh Airport to Nha Trang",
    titleVi: "Sân bay Cam Ranh đi Nha Trang",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600",
    price: "350,000đ",
    priceEn: "$15",
    type: "Airport Transfer",
    typeVi: "Trung chuyển sân bay",
    desc: "Fast & reliable transfer, modern sedan, free cancellation.",
    descVi: "Trung chuyển nhanh chóng, dòng xe hiện đại, hủy chuyến miễn phí.",
  },
  {
    id: 2,
    title: "Da Nang to Hoi An Ancient Town",
    titleVi: "Đà Nẵng đi Phố cổ Hội An",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600",
    price: "450,000đ",
    priceEn: "$19",
    type: "Inter-provincial",
    typeVi: "Thuê xe liên tỉnh",
    desc: "Scenic route transfer, English-speaking driver, scenic stops.",
    descVi: "Tuyến đường đẹp, tài xế thân thiện, dừng chân ngắm cảnh tùy chọn.",
  },
  {
    id: 3,
    title: "Noi Bai Airport to Hanoi Center",
    titleVi: "Sân bay Nội Bài đi Trung tâm Hà Nội",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600",
    price: "280,000đ",
    priceEn: "$12",
    type: "Airport Transfer",
    typeVi: "Trung chuyển sân bay",
    desc: "Direct private car service, meet & greet included, no hidden fees.",
    descVi: "Xe riêng đi thẳng, đã bao gồm phí cầu đường, không phí ẩn.",
  },
  {
    id: 4,
    title: "Phu Quoc Airport to Duong Dong",
    titleVi: "Sân bay Phú Quốc đi Dương Đông",
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=600",
    price: "200,000đ",
    priceEn: "$9",
    type: "Airport Transfer",
    typeVi: "Trung chuyển sân bay",
    desc: "Instant pickup at terminal, air-conditioned comfortable ride.",
    descVi: "Đón ngay tại sảnh ra, xe đời mới máy lạnh êm ái.",
  },
  {
    id: 5,
    title: "Tan Son Nhat to Vung Tau Beach",
    titleVi: "Tân Sơn Nhất đi Biển Vũng Tàu",
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=600",
    price: "1,200,000đ",
    priceEn: "$50",
    type: "Inter-provincial",
    typeVi: "Thuê xe liên tỉnh",
    desc: "Limousine private car service, spacious seats, water & Wi-Fi.",
    descVi: "Dòng xe Limousine rộng rãi, trang bị nước uống và Wi-Fi miễn phí.",
  }
];

const reviews = [
  {
    id: 1,
    titleVi: "Tuyệt vời ngoài mong đợi!",
    titleEn: "Excellent service!",
    titleKo: "기대 이상의 서비스!",
    titleRu: "Отличный сервис!",
    descVi: "Tài xế đón tôi đúng giờ tại sân bay với bảng tên rõ ràng. Xe mới sạch sẽ, lái xe rất an toàn.",
    descEn: "The driver was waiting for us with a name sign. Very professional, neat car, and very safe driver.",
    descKo: "기사가 공항에서 제 이름이 적힌 피켓을 들고 제시간에 대기했습니다. 차가 깨끗하고 안전하게 운전해 주셨습니다.",
    descRu: "Водитель ждал меня в аэропорту с табличкой. Машина чистая, вождение безопасное.",
    rating: 5,
    author: "Minh Khoa",
    avatarBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    avatarText: "MK",
    route: "Cam Ranh ➔ Nha Trang"
  },
  {
    id: 2,
    titleVi: "Rất chuyên nghiệp",
    titleEn: "Very professional",
    titleKo: "매우 전문적입니다",
    titleRu: "Очень профессионально",
    descVi: "Đặt xe trực tuyến cực kỳ đơn giản. Nhân viên hỗ trợ nhiệt tình khi chuyến bay của tôi bị hoãn 2 tiếng.",
    descEn: "Booking online was super easy. Customer support was helpful when my flight was delayed by 2 hours.",
    descKo: "온라인 예약이 아주 간편했습니다. 비행기가 2시간 지연되었을 때 고객 지원팀이 친절하게 도와주었습니다.",
    descRu: "Бронирование онлайн очень простое. Поддержка помогла, когда мой рейс задержали на 2 часа.",
    rating: 5,
    author: "Elena S.",
    avatarBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    avatarText: "ES",
    route: "Đà Nẵng ➔ Hội An"
  },
  {
    id: 3,
    titleVi: "Sẽ tiếp tục ủng hộ",
    titleEn: "Highly recommended!",
    titleKo: "적극 추천합니다!",
    titleRu: "Рекомендую всем!",
    descVi: "Dịch vụ tuyệt vời, xe Limousine rộng rãi thoải mái. Giá cả minh bạch không phát sinh thêm chi phí.",
    descEn: "Excellent limousine service, spacious and cozy. Transparent pricing, no hidden costs.",
    descKo: "훌륭한 리무진 서비스, 넓고 아늑합니다. 요금이 투명하고 추가 요금이 없습니다.",
    descRu: "Отличный сервис лимузинов, просторно и уютно. Прозрачные цены без скрытых комиссий.",
    rating: 5,
    author: "David L.",
    avatarBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
    avatarText: "DL",
    route: "Hà Nội ➔ Nội Bài"
  },
  {
    id: 4,
    titleVi: "Xe sạch sẽ, đi êm ái",
    titleEn: "Clean and smooth ride",
    titleKo: "차량이 청결하고 안락함",
    titleRu: "Чисто и плавно",
    descVi: "Xe rất sạch sẽ và thơm, tài xế lịch sự chạy xe cẩn thận. Giá cả phải chăng.",
    descEn: "The car was clean and smelled nice. The driver was polite and drove carefully. Affordable price.",
    descKo: "차가 깨끗하고 좋은 향기가 났습니다. 기사가 정중하고 조심히 운전했습니다. 가격도 합리적입니다.",
    descRu: "Машина была чистой, водитель вежлив и вел аккуратно. Приемлемая цена.",
    rating: 5,
    author: "Park M.",
    avatarBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    avatarText: "PM",
    route: "Sài Gòn ➔ Vũng Tàu"
  },
  {
    id: 5,
    titleVi: "Hỗ trợ khách hàng tuyệt vời",
    titleEn: "Fantastic support",
    titleKo: "최고의 고객 지원",
    titleRu: "Отличная поддержка",
    descVi: "Tôi cần thay đổi giờ đón phút chót và được tổng đài hỗ trợ đổi xe chỉ trong 10 phút. Rất hài lòng!",
    descEn: "I needed to change my pick-up time last minute, and support re-arranged it in 10 minutes. Extremely satisfied!",
    descKo: "마지막 순간에 시간을 변경해야 했는데 지원팀에서 10분 만에 차량을 재배정해 주었습니다. 대만족!",
    descRu: "Мне нужно было изменить время встречи в последний момент, поддержка решила все за 10 минут. Очень доволен!",
    rating: 5,
    author: "Ivan T.",
    avatarBg: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
    avatarText: "IT",
    route: "Nha Trang ➔ Đà Lạt"
  }
];

export default function IndexPage() {
  const { language } = useI18n();
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [tripType, setTripType] = useState<"one-way" | "return">("one-way");
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);

    const interval = setInterval(() => {
      if (reviewsRef.current) {
        const container = reviewsRef.current;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        const maxScrollLeft = scrollWidth - clientWidth;

        if (container.scrollLeft >= maxScrollLeft - 10) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          const firstCard = container.querySelector(".review-card");
          const cardWidth = firstCard ? firstCard.clientWidth : 380;
          container.scrollBy({ left: cardWidth + 24, behavior: "smooth" });
        }
      }
    }, 4000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeLang = language;
  const tr = homeTranslations[activeLang];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -380, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 380, behavior: "smooth" });
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Self-contained CSS for scrollbar hide and styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite ease-in-out;
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Hero Section */}
      <section className="relative w-full min-h-[680px] lg:h-[720px] flex items-center justify-center pt-24 pb-16 overflow-hidden">
        {/* Background Image with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1920')`
          }}
        >
          <div className="absolute inset-0 bg-black/55 dark:bg-black/65 backdrop-blur-[2px]" />
        </div>

        {/* Hero Content Grid */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center h-full">
          {/* Left: Branding & Message */}
          <div className="lg:col-span-7 text-left space-y-6 max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight leading-none drop-shadow-md">
              {tr.heroTitle.split('. ').map((part, idx, arr) => (
                <span key={part} className="block">
                  {part}{idx < arr.length - 1 ? "." : ""}
                </span>
              ))}
            </h1>
            <p className="text-lg sm:text-xl text-slate-200 drop-shadow-sm font-semibold max-w-xl leading-relaxed">
              {tr.heroSubtitle}
            </p>
          </div>

          {/* Right: Floating Search Form Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col gap-5">
              {/* Tab Selector */}
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full flex gap-1">
                <button
                  type="button"
                  onClick={() => setTripType("one-way")}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer ${tripType === "one-way"
                    ? "bg-white dark:bg-slate-700 text-[#0b66e4] dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                >
                  {tr.oneWay}
                </button>
                <button
                  type="button"
                  onClick={() => setTripType("return")}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer ${tripType === "return"
                    ? "bg-white dark:bg-slate-700 text-[#0b66e4] dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                >
                  {tr.returnTrip}
                </button>
              </div>

              {/* Form inputs */}
              <form onSubmit={handleSearch} className="flex flex-col gap-4">
                {/* Inputs rounded container */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-950/20 relative">

                  {/* Vertical dotted connector line between From and To icons */}
                  <div className="absolute left-7 top-[34px] h-[48px] w-px border-l border-dashed border-slate-300 dark:border-slate-600 hidden sm:block z-0 pointer-events-none" />

                  {/* Pickup */}
                  <div className="flex items-center gap-3 px-4 py-3 relative z-10">
                    <div className="w-6 h-6 rounded-full border-2 border-[#0b66e4] flex items-center justify-center bg-white dark:bg-slate-900 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-[#0b66e4]" />
                    </div>
                    <div className="w-full text-left">
                      <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {language === "vi" ? "ĐIỂM ĐÓN" : "PICKUP LOCATION"}
                      </label>
                      <input
                        type="text"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        placeholder={tr.pickupPlaceholder}
                        className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 mt-0.5"
                        required
                      />
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="flex items-center gap-3 px-4 py-3 relative z-10">
                    <div className="w-6 h-6 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-white dark:bg-slate-900 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="w-full text-left">
                      <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {language === "vi" ? "ĐIỂM ĐẾN" : "DESTINATION"}
                      </label>
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder={tr.destPlaceholder}
                        className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 mt-0.5"
                        required
                      />
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Calendar className="text-amber-500 shrink-0" size={20} />
                    <div className="w-full text-left grid grid-cols-12 gap-2">
                      <div className="col-span-7">
                        <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {tr.dateLabel}
                        </label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none mt-0.5 [color-scheme:light] dark:[color-scheme:dark]"
                          required
                        />
                      </div>
                      <div className="col-span-5 border-l border-slate-200 dark:border-slate-800 pl-2 flex flex-col justify-center">
                        <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {language === "vi" ? "GIỜ ĐÓN" : "TIME"}
                        </label>
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none mt-0.5 [color-scheme:light] dark:[color-scheme:dark]"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Counters row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Passengers counter */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col gap-1 text-left bg-slate-50/50 dark:bg-slate-950/20">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {tr.passengers}
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <button
                        type="button"
                        onClick={() => setPassengers(Math.max(1, passengers - 1))}
                        className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-all cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {passengers}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPassengers(passengers + 1)}
                        className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-all cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Luggage counter */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col gap-1 text-left bg-slate-50/50 dark:bg-slate-950/20">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {tr.luggage}
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <button
                        type="button"
                        onClick={() => setLuggage(Math.max(0, luggage - 1))}
                        className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-all cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {luggage}
                      </span>
                      <button
                        type="button"
                        onClick={() => setLuggage(luggage + 1)}
                        className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-all cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Continue button */}
                <Button
                  type="submit"
                  className="w-full h-12 rounded-2xl font-black text-sm bg-[#0b66e4] text-white hover:bg-blue-700 shadow-md gap-2 border-none cursor-pointer mt-1"
                >
                  {tr.searchBtn}
                </Button>
              </form>

              {/* Bottom statistics bar */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                  <UserCheck size={20} />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-left leading-snug">
                  {tr.statsLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Row */}
      <section className="w-full py-16 bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white dark:hover:bg-slate-900/50 transition-all duration-300">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{tr.feature1Title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">{tr.feature1Desc}</p>
            </div>
          </div>
          {/* Feature 2 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white dark:hover:bg-slate-900/50 transition-all duration-300">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
              <UserCheck size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{tr.feature2Title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">{tr.feature2Desc}</p>
            </div>
          </div>
          {/* Feature 3 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white dark:hover:bg-slate-900/50 transition-all duration-300">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
              <Car size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{tr.feature3Title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">{tr.feature3Desc}</p>
            </div>
          </div>
          {/* Feature 4 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white dark:hover:bg-slate-900/50 transition-all duration-300">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-2xl shrink-0">
              <Headset size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{tr.feature4Title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">{tr.feature4Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Transfers & Tours Carousel */}
      <section className="w-full py-20 max-w-7xl mx-auto px-6">
        <div className="flex flex-row items-end justify-between mb-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1 text-xs font-extrabold text-[#0b66e4] uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full">
              <Sparkles size={12} className="animate-pulse" />
              {activeLang === "vi" ? "Đề xuất" : "Featured"}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100">{tr.popularTitle}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{tr.popularSubtitle}</p>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={scrollLeft}
              className="p-3 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 cursor-pointer transition-all"
              aria-label="Previous tour"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={scrollRight}
              className="p-3 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 cursor-pointer transition-all"
              aria-label="Next tour"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Carousel Container - Grid 3 cols layout logic using snap */}
        <div
          ref={carouselRef}
          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-6 pb-4"
        >
          {popularTours.map((tour) => (
            <div
              key={tour.id}
              className="min-w-[85vw] sm:min-w-[45vw] lg:min-w-[calc(33.333%-16px)] snap-start bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300"
            >
              {/* Image & Type Badge */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={tour.image}
                  alt={activeLang === "vi" ? tour.titleVi : tour.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-[#0b66e4] shadow-sm border border-slate-100/50 dark:border-slate-800/50">
                  {activeLang === "vi" ? tour.typeVi : tour.type}
                </span>
              </div>

              {/* Card Details */}
              <div className="p-6 flex flex-col flex-grow justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-[#0b66e4] transition-colors">
                    {activeLang === "vi" ? tour.titleVi : tour.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                    {activeLang === "vi" ? tour.descVi : tour.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/50 pt-4">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">
                      {activeLang === "vi" ? "Giá từ" : "Price from"}
                    </span>
                    <span className="text-base font-black text-slate-800 dark:text-slate-100">
                      {activeLang === "vi" ? tour.price : tour.priceEn}
                    </span>
                  </div>
                  <NextLink
                    href="/dashboard"
                    className="flex items-center gap-1 text-xs font-extrabold text-[#0b66e4] hover:text-[#0b66e4]/80 transition-colors no-underline"
                  >
                    {tr.bookNow}
                    <ArrowRight size={14} />
                  </NextLink>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Loved by Travelers */}
      <section className="w-full py-20 bg-slate-50/50 dark:bg-slate-900/10 border-y border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100">{tr.lovedTitle}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{tr.lovedSubtitle}</p>
            <div className="flex items-center justify-center gap-1 text-amber-500 pt-1">
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-2">4.9/5 (1,200+ reviews)</span>
            </div>
          </div>

          <div
            ref={reviewsRef}
            className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-6 pb-4 w-full"
          >
            {reviews.map((rev) => {
              const title = activeLang === "vi" ? rev.titleVi : activeLang === "en" ? rev.titleEn : activeLang === "ko" ? rev.titleKo : rev.titleRu;
              const desc = activeLang === "vi" ? rev.descVi : activeLang === "en" ? rev.descEn : activeLang === "ko" ? rev.descKo : rev.descRu;
              return (
                <div
                  key={rev.id}
                  className="review-card min-w-[85vw] sm:min-w-[45vw] lg:min-w-[calc(33.333%-16px)] snap-start bg-white dark:bg-slate-900/20 dark:border-white/10 p-6 rounded-3xl border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.01)] flex flex-col justify-between gap-6 hover:shadow-md transition-all duration-300"
                >
                  <div className="space-y-3">
                    <div className="flex text-amber-500 gap-0.5">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                      {title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${rev.avatarBg}`}>
                      {rev.avatarText}
                    </div>
                    <div>
                      <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">{rev.author}</span>
                      <span className="block text-[9px] font-bold text-slate-400">{rev.route}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Travel Inspiration */}
      <section className="w-full py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100">{tr.inspirationTitle}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{tr.inspirationSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Item 1 */}
          <div className="h-64 rounded-3xl overflow-hidden relative group shadow-sm border border-slate-100 dark:border-slate-800">
            <img
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600"
              alt="Mountain Road"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-5">
              <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                {activeLang === "vi" ? "Kinh nghiệm du lịch Tây Bắc" : "Northwest Roadtrip Tips"}
              </span>
            </div>
          </div>

          {/* Item 2 */}
          <div className="h-64 rounded-3xl overflow-hidden relative group shadow-sm border border-slate-100 dark:border-slate-800">
            <img
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600"
              alt="Beach Holiday"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-5">
              <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                {activeLang === "vi" ? "Cẩm nang biển Nha Trang" : "Nha Trang Coastal Guide"}
              </span>
            </div>
          </div>

          {/* Item 3 */}
          <div className="h-64 rounded-3xl overflow-hidden relative group shadow-sm border border-slate-100 dark:border-slate-800">
            <img
              src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=600"
              alt="Luxury ride"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-5">
              <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                {activeLang === "vi" ? "Hành trình xe cao cấp" : "Premium Fleets & Travel"}
              </span>
            </div>
          </div>

          {/* Instagram Follow Card */}
          <div className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center p-6 gap-4 group hover:bg-[#0b66e4]/5 dark:hover:bg-[#0b66e4]/10 transition-all duration-300">
            <div className="p-4 bg-[#0b66e4]/10 dark:bg-[#0b66e4]/20 text-[#0b66e4] rounded-full group-hover:scale-110 transition-transform">
              <InstagramIcon size={28} />
            </div>
            <div className="space-y-1">
              <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{tr.followUs}</span>
              <span className="block text-sm font-black text-[#0b66e4]">@travelgo_vn</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-[#0b66e4] py-16 text-white text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">{tr.ctaTitle}</h2>
          <p className="text-slate-100 text-sm md:text-base max-w-2xl mx-auto font-medium">
            {tr.ctaSubtitle}
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-white hover:bg-slate-100 text-[#0b66e4] font-black px-8 h-12 md:h-14 rounded-full shadow-lg text-sm border-none cursor-pointer"
          >
            {tr.ctaBtn}
          </Button>
        </div>
      </section>

      {/* Contact & Back to Top Buttons in bottom-right corner */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Contact Menu Popup */}
        {showContactMenu && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 w-40 flex flex-col gap-1.5 animate-fade-in-up">
            <a
              href="tel:0901234567"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-[#0b66e4]/10 hover:text-[#0b66e4] transition-colors no-underline"
            >
              <Phone size={14} className="text-[#0b66e4]" />
              <span>{language === "vi" ? "Gọi ngay" : language === "en" ? "Call Now" : language === "ko" ? "지금 전화" : "Позвонить"}</span>
            </a>
            <a
              href="https://zalo.me/0901234567"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-[#0b66e4]/10 hover:text-[#0b66e4] transition-colors no-underline border-t border-slate-100 dark:border-slate-700/50"
            >
              <MessageCircle size={14} className="text-[#0b66e4]" />
              <span>Zalo</span>
            </a>
          </div>
        )}

        <button
          onClick={() => setShowContactMenu(!showContactMenu)}
          className={`p-4 rounded-full border shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer flex items-center justify-center ${showContactMenu
            ? "bg-[#0b66e4] border-[#0b66e4] text-white"
            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-[#0b66e4] dark:text-white"
            }`}
          aria-label="Contact Support"
        >
          <Headset size={22} />
        </button>

        {/* Back to Top Button in bottom-right corner below Contact Support */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="p-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#0b66e4] dark:text-white shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer animate-bounce-subtle flex items-center justify-center"
            aria-label="Back to Top"
          >
            <ChevronUp size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
