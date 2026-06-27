export type Language = "vi" | "en" | "ko" | "ru";

export interface TranslationDictionary {
  nav: {
    home: string;
    rentCar: string;
    selfDrive: string;
    airportTransfer: string;
    tour: string;
    cityTour: string;
    provinceTour: string;
    docs: string;
    about: string;
  };
  lang: {
    select: string;
    vi: string;
    en: string;
    ko: string;
    ru: string;
  };
  home: {
    title1: string;
    title2: string;
    subtitle: string;
    viewDemo: string;
    githubLink: string;
  };
  demo: {
    title: string;
    subtitle: string;
    customer: string;
    admin: string;
    config: string;
    configDesc: string;
    submenus: string;
    badges: string;
    activeRoute: string;
    activityLog: string;
    clear: string;
    mockRoute: string;
    mockRouteDesc: string;
    goDashboard: string;
    goAnalytics: string;
    goFlights: string;
    goHotels: string;
    goSearchHome: string;
    goDiscover: string;
    goMyBookings: string;
  };
  dashboard: {
    welcome: string;
    goldMember: string;
    location: string;
    bookNewTrip: string;
    nextDestination: string;
    departure: string;
    countdown: string;
    days: string;
    viewTicket: string;
    confirmedTrips: string;
    bookedCar: string;
    seats: string;
    guests: string;
    baggageWeight: string;
    recentBookings: string;
    all: string;
    confirmed: string;
    pending: string;
    completed: string;
    ref: string;
    route: string;
    date: string;
    status: string;
    action: string;
    details: string;
    rebook: string;
    cancel: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  vi: {
    nav: {
      home: "Trang chủ",
      rentCar: "Thuê xe đi tỉnh",
      selfDrive: "Thuê xe tự lái",
      airportTransfer: "Đón tiễn sân bay",
      tour: "Tour du lịch",
      cityTour: "Tham quan thành phố",
      provinceTour: "Tham quan tỉnh khác",
      docs: "Tài liệu",
      about: "Giới thiệu",
    },
    lang: {
      select: "Chọn ngôn ngữ",
      vi: "Tiếng Việt",
      en: "English",
      ko: "한국어",
      ru: "Русский",
    },
    home: {
      title1: "Khám phá thế giới",
      title2: "cùng TravelGo",
      subtitle: "Hệ thống đặt xe liên tỉnh, tour du lịch trọn gói và dịch vụ nghỉ dưỡng cao cấp.",
      viewDemo: "Trải nghiệm Sidebar Động",
      githubLink: "Mã nguồn GitHub",
    },
    demo: {
      title: "Giao diện Sidebar Động",
      subtitle: "Chuyển đổi vai trò để xem sidebar hiển thị động các cấu trúc, huy hiệu và ảnh đại diện.",
      customer: "Khách hàng",
      admin: "Quản trị viên",
      config: "Cấu hình Sidebar",
      configDesc: "Thu nhỏ/Mở rộng: Nhấn vào nút mũi tên nổi ở cạnh sidebar. Khi thu nhỏ, sidebar thu về dạng icon kèm tooltip gợi ý.",
      submenus: "Menu con: Các nhóm liên kết (như Đặt vé ở chế độ Admin) hỗ trợ menu con đóng mở mượt mà.",
      badges: "Huy hiệu: Hiển thị thêm các nhãn số hoặc chữ đi kèm các màu sắc trạng thái khác nhau.",
      activeRoute: "Đường dẫn hoạt động: Tự động phát hiện và highlight mục đang chọn.",
      activityLog: "Nhật ký hoạt động",
      clear: "Xóa",
      mockRoute: "Trình chuyển hướng giả lập",
      mockRouteDesc: "Nhấn các nút bên dưới để chuyển đổi đường dẫn giả lập và xem sidebar cập nhật highlight.",
      goDashboard: "Đến Bảng điều khiển",
      goAnalytics: "Đến Báo cáo thống kê",
      goFlights: "Đến Vé máy bay",
      goHotels: "Đến Đặt khách sạn",
      goSearchHome: "Đến Tìm kiếm",
      goDiscover: "Đến Khám phá ưu đãi",
      goMyBookings: "Đến Đặt chỗ của tôi",
    },
    dashboard: {
      welcome: "Chào mừng trở lại,",
      goldMember: "Thành viên Vàng",
      location: "Cam Ranh, Việt Nam",
      bookNewTrip: "Đặt chuyến đi mới",
      nextDestination: "ĐIỂM ĐẾN TIẾP THEO",
      departure: "Khởi hành",
      countdown: "Đếm ngược",
      days: "Ngày",
      viewTicket: "Xem vé",
      confirmedTrips: "Chuyến đi đã xác nhận",
      bookedCar: "Xe đã đặt",
      seats: "chỗ",
      guests: "hành khách",
      baggageWeight: "Cân nặng hành lý",
      recentBookings: "Đơn đặt gần đây",
      all: "Tất cả",
      confirmed: "Đã xác nhận",
      pending: "Chờ xử lý",
      completed: "Đã hoàn thành",
      ref: "MÃ ĐƠN",
      route: "TUYẾN ĐƯỜNG",
      date: "NGÀY",
      status: "TRẠNG THÁI",
      action: "THAO TÁC",
      details: "Chi tiết",
      rebook: "Đặt lại",
      cancel: "Hủy",
    },
  },
  en: {
    nav: {
      home: "Home",
      rentCar: "Provincial Transfers",
      selfDrive: "Self-Drive Rental",
      airportTransfer: "Airport Transfer",
      tour: "Tours",
      cityTour: "City Tour",
      provinceTour: "Other Provinces",
      docs: "Docs",
      about: "About",
    },
    lang: {
      select: "Select Language",
      vi: "Tiếng Việt",
      en: "English",
      ko: "한국어",
      ru: "Русский",
    },
    home: {
      title1: "Explore the World",
      title2: "with TravelGo",
      subtitle: "Inter-province car rental, comprehensive holiday tours, and premium hospitality services.",
      viewDemo: "Try Dynamic Sidebar",
      githubLink: "GitHub Source",
    },
    demo: {
      title: "Dynamic Sidebar Showcase",
      subtitle: "Switch roles to see the sidebar dynamically re-render different layouts, badges, and avatars.",
      customer: "Customer",
      admin: "Admin",
      config: "Sidebar Configuration",
      configDesc: "Collapse / Expand: Click the floating arrow button on the sidebar edge. When collapsed, the sidebar transitions smoothly and lists icon tooltips.",
      submenus: "Sub-menus: Group nodes (like Bookings in Admin view) show smooth accordion submenus.",
      badges: "Badges: Add numeric or text tags with dynamic semantic colors.",
      activeRoute: "Active route: It inspects location.pathname to highlight active routes automatically.",
      activityLog: "Activity Log",
      clear: "Clear",
      mockRoute: "Mock Active Route Navigator",
      mockRouteDesc: "Since we are using real routes, click these buttons to mock navigate and see how the Sidebar highlights active paths.",
      goDashboard: "Go to Dashboard",
      goAnalytics: "Go to Analytics",
      goFlights: "Go to Flights",
      goHotels: "Go to Hotels",
      goSearchHome: "Go to Search Home",
      goDiscover: "Go to Discover Deals",
      goMyBookings: "Go to My Bookings",
    },
    dashboard: {
      welcome: "Welcome back,",
      goldMember: "Gold Member",
      location: "Cam Ranh, Vietnam",
      bookNewTrip: "Book New Trip",
      nextDestination: "NEXT DESTINATION",
      departure: "Departure",
      countdown: "Countdown",
      days: "Days",
      viewTicket: "View Ticket",
      confirmedTrips: "Confirmed Trips",
      bookedCar: "Booked Car",
      seats: "seats",
      guests: "guests",
      baggageWeight: "Baggage weight",
      recentBookings: "Recent Bookings",
      all: "All",
      confirmed: "Confirmed",
      pending: "Pending",
      completed: "Completed",
      ref: "REFERENCE",
      route: "ROUTE",
      date: "DATE",
      status: "STATUS",
      action: "ACTION",
      details: "Details",
      rebook: "Rebook",
      cancel: "Cancel",
    },
  },
  ko: {
    nav: {
      home: "홈",
      rentCar: "시외 차 렌트",
      selfDrive: "렌터카",
      airportTransfer: "공항 픽업",
      tour: "투어",
      cityTour: "도시 관광",
      provinceTour: "타 시도 관광",
      docs: "문서",
      about: "소개",
    },
    lang: {
      select: "언어 선택",
      vi: "Tiếng Việt",
      en: "English",
      ko: "한국어",
      ru: "Русский",
    },
    home: {
      title1: "세상을 탐험하다",
      title2: "TravelGo와 함께",
      subtitle: "시외 차량 렌트, 종합 패키지 여행 및 프리미엄 리조트 서비스를 이용해보세요.",
      viewDemo: "동적 사이드바 체험",
      githubLink: "GitHub 소스코드",
    },
    demo: {
      title: "동적 사이드바 쇼케이스",
      subtitle: "역할을 전환하여 사이드바가 다양한 레이아웃, 배지 및 아바타를 동적으로 렌더링하는 것을 확인하세요.",
      customer: "고객",
      admin: "관리자",
      config: "사이드바 구성",
      configDesc: "접기 / 펼치기: 사이드바 가장자리의 플로팅 화살표 버튼을 클릭하세요. 접히면 사이드바가 부드럽게 전환되고 아이콘 툴팁이 나열됩니다.",
      submenus: "하위 메뉴: 그룹 노드(관리자 보기의 예약과 같이)는 부드러운 아코디언 하위 메뉴를 보여줍니다.",
      badges: "배지: 동적 의미 체계 색상과 함께 숫자 또는 텍스트 태그를 추가합니다.",
      activeRoute: "활성 경로: location.pathname을 검사하여 활성 경로를 자동으로 강조 표시합니다.",
      activityLog: "활동 로그",
      clear: "지우기",
      mockRoute: "가상 활성 경로 네비게이터",
      mockRouteDesc: "실제 경로를 사용하므로 이 버튼들을 클릭하여 가상으로 탐색하고 사이드바가 활성 경로를 강조 표시하는 것을 확인하세요.",
      goDashboard: "대시보드로 이동",
      goAnalytics: "분석으로 이동",
      goFlights: "항공편 예약으로 이동",
      goHotels: "호텔 예약으로 이동",
      goSearchHome: "검색 홈으로 이동",
      goDiscover: "할인 혜택 찾기로 이동",
      goMyBookings: "내 예약으로 이동",
    },
    dashboard: {
      welcome: "다시 오신 것을 환영합니다,",
      goldMember: "골드 회원",
      location: "베트남 깜라인",
      bookNewTrip: "새 여행 예약",
      nextDestination: "다음 목적지",
      departure: "출발",
      countdown: "카운트다운",
      days: "일",
      viewTicket: "티켓 보기",
      confirmedTrips: "확정된 여행",
      bookedCar: "예약된 차량",
      seats: "인승",
      guests: "명의 승객",
      baggageWeight: "수하물 무게",
      recentBookings: "최근 예약 내역",
      all: "전체",
      confirmed: "확정됨",
      pending: "대기 중",
      completed: "완료됨",
      ref: "예약 번호",
      route: "노선",
      date: "날짜",
      status: "상태",
      action: "작업",
      details: "상세 정보",
      rebook: "재예약",
      cancel: "취со",
    },
  },
  ru: {
    nav: {
      home: "Главная",
      rentCar: "Аренда авто с водителем",
      selfDrive: "Аренда авто (без водителя)",
      airportTransfer: "Трансфер в аэропорт",
      tour: "Туры",
      cityTour: "Экскурсия по городу",
      provinceTour: "Другие провинции",
      docs: "Документы",
      about: "О нас",
    },
    lang: {
      select: "Выбрать язык",
      vi: "Tiếng Việt",
      en: "English",
      ko: "한국어",
      ru: "Русский",
    },
    home: {
      title1: "Исследуй мир",
      title2: "с TravelGo",
      subtitle: "Аренда автомобилей между провинциями, комплексные туры и премиальный гостиничный сервис.",
      viewDemo: "Тест боковой панели",
      githubLink: "Исходный код на GitHub",
    },
    demo: {
      title: "Демонстрация динамического сайдбара",
      subtitle: "Переключайте роли, чтобы увидеть, как боковая панель динамически перерисовывает различные макеты, значки и аватары.",
      customer: "Клиент",
      admin: "Админ",
      config: "Настройка сайдбара",
      configDesc: "Свернуть / Развернуть: Нажмите на плавающую кнопку со стрелкой на краю панели. В свернутом состоянии панель плавно сжимается до значков с подсказками.",
      submenus: "Подменю: Групповые узлы (например, Бронирования) отображают плавное раскрывающееся подменю.",
      badges: "Значки: Добавляйте числовые или текстовые метки с динамическими семантическими цветами.",
      activeRoute: "Активный маршрут: Анализирует location.pathname для автоматической подсветки активных ссылок.",
      activityLog: "Журнал активности",
      clear: "Очистить",
      mockRoute: "Эмулятор активного пути",
      mockRouteDesc: "Поскольку мы используем реальные маршруты, нажимайте кнопки ниже для перехода и проверки подсветки пунктов.",
      goDashboard: "Панель управления",
      goAnalytics: "Статистика",
      goFlights: "Авиабилеты",
      goHotels: "Отели",
      goSearchHome: "Поиск",
      goDiscover: "Акции и скидки",
      goMyBookings: "Мои бронирования",
    },
    dashboard: {
      welcome: "С возвращением,",
      goldMember: "Золотой участник",
      location: "Камрань, Вьетнам",
      bookNewTrip: "Забронировать поездку",
      nextDestination: "СЛЕДУЮЩИЙ ПУНКТ НАЗНАЧЕНИЯ",
      departure: "Отправление",
      countdown: "Обратный отсчет",
      days: "дн.",
      viewTicket: "Посмотреть билет",
      confirmedTrips: "Подтвержденные поездки",
      bookedCar: "Забронированное авто",
      seats: "мест",
      guests: "пассажира",
      baggageWeight: "Вес багажа",
      recentBookings: "Последние бронирования",
      all: "Все",
      confirmed: "Подтверждено",
      pending: "В ожидании",
      completed: "Завершено",
      ref: "КОД",
      route: "МАРШРУТ",
      date: "ДАТА",
      status: "СТАТУС",
      action: "ДЕЙСТВИЕ",
      details: "Детали",
      rebook: "Повторить",
      cancel: "Отмена",
    },
  },
};
