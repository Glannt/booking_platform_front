"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  Compass,
  AlertCircle,
  Eye,
  Edit3
} from "lucide-react";
import { Button, Input, Table, toast, Select, ListBox, Tooltip } from "@heroui/react";
import { StatusChip } from "@/components/StatusChip";
import ServiceDetailModal from "@/components/admin/services/ServiceDetailModal";
import ServiceCreateModal from "@/components/admin/services/ServiceCreateModal";
import ServiceDeleteModal from "@/components/admin/services/ServiceDeleteModal";
import { useI18n } from "@/context/LanguageContext";
import { headerColumns } from "@/config/headerColumns";

import {
  ServiceDto,
  ServiceOptionDto,
  ServiceItineraryDto,
  ServiceTranslationDto,
  getServices
} from "@/lib/api/services";
import {
  ServiceCategoryDto,
  ServiceCategoryTranslationDto,
  getCategories,
  createCategory
} from "@/lib/api/categories";
import { backendUrl } from "@/lib/api/client";

export type {
  ServiceDto,
  ServiceCategoryDto,
  ServiceOptionDto,
  ServiceItineraryDto,
  ServiceTranslationDto,
  ServiceCategoryTranslationDto
};

// Initial fallback mock data
const fallbackCategories: ServiceCategoryDto[] = [
  {
    id: 1,
    iconImageId: 101,
    status: "published",
    translations: [
      { locale: "vi", name: "Tour Du Lịch", slug: "tour-du-lich", description: "Các tour tham quan trọn gói" },
      { locale: "en", name: "Sightseeing Tours", slug: "sightseeing-tours", description: "All-inclusive guided sightseeing tours" },
      { locale: "ko", name: "관광 투어", slug: "sightseeing-tours-ko", description: "가이드 관광 투어 상품" },
      { locale: "ru", name: "Экскурсии", slug: "sightseeing-tours-ru", description: "Экскурсионные туры" }
    ]
  },
  {
    id: 2,
    iconImageId: 102,
    status: "published",
    translations: [
      { locale: "vi", name: "Dịch Vụ Xe", slug: "dich-vu-xe", description: "Thuê xe và đưa đón sân bay" },
      { locale: "en", name: "Car Transfers", slug: "car-transfers", description: "Private airport pickup and vehicle transfers" },
      { locale: "ko", name: "차량 샌딩", slug: "car-transfers-ko", description: "개인 공항 픽업 및 차량 샌딩" },
      { locale: "ru", name: "Трансферы", slug: "car-transfers-ru", description: "Аренда авто и трансферы" }
    ]
  }
];

const fallbackServices: ServiceDto[] = [
  {
    id: 1,
    categoryId: 1,
    thumbnailId: 201,
    status: "published",
    translations: [
      { locale: "vi", name: "Tour Bà Nà Hills - Đường Lên Tiên Cảnh", description: "Khám phá Cầu Vàng nổi tiếng thế giới, Làng Pháp cổ kính và khu vui chơi giải trí Fantasy Park.", content: "Chi tiết lịch trình thú vị bao gồm xe đưa đón khứ hồi, vé cáp treo treo, ăn trưa buffet..." },
      { locale: "en", name: "Ba Na Hills & Golden Bridge Day Tour", description: "Walk on the world-famous Golden Bridge, visit the French Village, and ride the cable car.", content: "Detailed itinerary includes round-trip transfers, buffet lunch, cable car ticket, guide..." },
      { locale: "ko", name: "바나힐 & 골든브릿지 일일 투어", description: "세계적으로 유명한 골든 브릿지와 프랑스 마을을 방문하고 왕복 케이블카를 체험하세요.", content: "상세 일정: 호텔 픽업, 바나힐 케이블카 탑승, 뷔페 중식 포함..." },
      { locale: "ru", name: "Однодневный тур на Бана Хиллс и Золотой мост", description: "Посетите всемирно известный Золотой мост и Французскую деревню.", content: "В стоимость включен трансфер, фуникулер, обед-шведский стол..." }
    ],
    options: [
      {
        id: 11,
        price: 1590000,
        translations: [
          { locale: "vi", name: "Vé Người Lớn", description: "Cho khách cao từ 1m4 trở lên (Đã bao gồm ăn trưa buffet)" },
          { locale: "en", name: "Adult Ticket", description: "For guests 1.4m and above (Buffet lunch included)" },
          { locale: "ko", name: "성인 티켓", description: "키 1.4m 이상 (중식 뷔페 포함)" },
          { locale: "ru", name: "Взрослый билет", description: "Для гостей выше 140 см (обед включен)" }
        ]
      },
      {
        id: 12,
        price: 1250000,
        translations: [
          { locale: "vi", name: "Vé Trẻ Em", description: "Cho trẻ cao từ 1m đến dưới 1m4 (Đã bao gồm ăn trưa)" },
          { locale: "en", name: "Child Ticket", description: "For children 1m to 1.39m (Lunch included)" },
          { locale: "ko", name: "소아 티켓", description: "키 1m - 1.39m (중식 포함)" },
          { locale: "ru", name: "Детский билет", description: "Для детей от 100 до 139 см (обед включен)" }
        ]
      }
    ],
    itineraries: [
      {
        id: 21,
        dayNumber: 1,
        translations: [
          { locale: "vi", dayTitle: "Đón khách, Cáp treo & Khám phá Cầu Vàng", timeline: "08:00 - Xe đón tại khách sạn trung tâm Đà Nẵng\n09:00 - Check-in ga cáp treo Bà Nà Hills\n10:00 - Tham quan Cầu Vàng, hầm rượu cổ Debay\n12:00 - Ăn trưa buffet tại nhà hàng Làng Pháp\n14:00 - Vui chơi tại Fantasy Park\n16:30 - Xuống cáp treo, xe đưa về lại khách sạn" },
          { locale: "en", dayTitle: "Pick up, Cable Car & Golden Bridge", timeline: "08:00 - Pick up from Da Nang hotels\n09:00 - Board the cable car at Ba Na Hills station\n10:00 - Visit Golden Bridge & French wineries\n12:00 - Buffet lunch at French Village restaurant\n14:00 - Fun times at Fantasy Park\n16:30 - Cable car return & drop-off at hotels" }
        ]
      }
    ]
  }
];

export default function ServicesManagementPage() {
  const { t } = useI18n();
  const [categories, setCategories] = useState<ServiceCategoryDto[]>(fallbackCategories);
  const [services, setServices] = useState<ServiceDto[]>(fallbackServices);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  // Modal State Triggers
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceDto | null>(null);
  const [detailsDefaultEditMode, setDetailsDefaultEditMode] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    if (type === "success") {
      toast.success(message);
    } else {
      toast.danger(message);
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      let loadedCats = fallbackCategories;
      try {
        const catJson = await getCategories();
        if (catJson.data) loadedCats = catJson.data;
      } catch (e) {
        console.warn("Failed to fetch categories:", e);
      }

      let loadedSvcs = fallbackServices;
      try {
        const svcJson = await getServices();
        if (svcJson.data) loadedSvcs = svcJson.data;
      } catch (e) {
        console.warn("Failed to fetch services:", e);
      }

      setCategories(loadedCats);
      setServices(loadedSvcs);
    } catch (error) {
      console.error("Error loading tour data from API:", error);
      showToast("Cannot connect to API. Loaded offline mock data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSeedCategories = async () => {
    try {
      let created = 0;
      for (const cat of fallbackCategories) {
        const res = await createCategory({
          iconImageId: cat.iconImageId,
          status: cat.status,
          translations: cat.translations.map(t => ({
            locale: t.locale,
            name: t.name,
            slug: t.slug,
            description: t.description
          }))
        });
        if (res.data) created++;
      }
      showToast(`Category Seed completed. Created ${created} categories.`, "success");
      fetchInitialData();
    } catch (e) {
      showToast("Seed failed. Action simulated offline.", "success");
    }
  };

  const handleDeleteSuccess = (id: number) => {
    setServices(prev => prev.filter(s => s.id !== id));
    if (selectedService?.id === id) {
      setSelectedService(null);
    }
  };

  const handleSaveSuccess = () => {
    fetchInitialData();
  };

  const filteredServices = services.filter(s => {
    const trans = s.translations.find(t => t.locale === "vi") || s.translations[0];
    const nameMatch = trans?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const categoryMatch = selectedCategoryFilter === "all" || s.categoryId === Number(selectedCategoryFilter);
    return nameMatch && categoryMatch;
  });

  const getCategoryName = (catId: number) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return "Không xác định";
    const trans = cat.translations.find(t => t.locale === "vi") || cat.translations[0];
    return trans?.name || `Category #${catId}`;
  };

  return (
    <div className="w-full space-y-6">


      {/* Categories Seeding Info & Search Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-black p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-grow max-w-2xl">
          <div className="relative flex-grow min-w-[200px]">
            <Search className="absolute left-3 top-3.5 text-slate-400 dark:text-slate-500" size={16} />
            <Input
              type="text"
              placeholder={"Tìm kiếm tour..."}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select
            selectedKey={selectedCategoryFilter}
            onSelectionChange={(key) => setSelectedCategoryFilter(key as string)}
            className="w-56"
          >
            <Select.Trigger className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold cursor-pointer h-[42px] flex items-center justify-between min-w-[200px]">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 w-[var(--trigger-width)] z-50">
              <ListBox>
                <ListBox.Item id="all" textValue="Tất cả danh mục">
                  Tất cả danh mục
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {categories.map((c) => {
                  const tr = c.translations.find((t) => t.locale === "vi") || c.translations[0];
                  const name = tr?.name || `ID: ${c.id}`;
                  return (
                    <ListBox.Item key={c.id} id={String(c.id)} textValue={name}>
                      {name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  );
                })}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            variant="outline"
            className="rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[var(--bg-card)] dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-200 shadow-sm border border-transparent"
            onClick={handleSeedCategories}
          >
            <RefreshCw size={16} className="mr-1.5" />
            {"Đồng bộ Danh Mục"}
          </Button>

          <Button
            className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none flex items-center gap-1.5 transition-colors"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus size={16} />
            <span>{"Thêm Dịch vụ"}</span>
          </Button>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="animate-spin text-primary" size={32} />
            <p className="text-sm font-bold text-slate-500">{"Đang tải danh sách dịch vụ..."}</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Compass className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
              {"Không tìm thấy kết quả"}
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              {"Không có tour du lịch hay dịch vụ nào khớp với bộ lọc tìm kiếm hiện tại."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="Bảng quản lý dịch vụ" className="w-full text-left">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header className="bg-slate-50 dark:bg-black/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {headerColumns.services(t).map((col) => (
                      <Table.Column
                        key={col.id}
                        id={col.id}
                        isRowHeader={col.isRowHeader}
                        className={col.className}
                      >
                        {col.value}
                      </Table.Column>
                    ))}
                  </Table.Header>
                  <Table.Body className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredServices.map((svc) => {
                      const trans = svc.translations.find((t) => t.locale === "vi") || svc.translations[0];
                      return (
                        <Table.Row
                          key={svc.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-[var(--bg-page)]/20 transition-colors duration-150"
                        >
                          <Table.Cell className="px-6 py-4 font-mono text-xs text-slate-400">#{svc.id}</Table.Cell>
                          <Table.Cell className="px-6 py-4">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{trans?.name || "Untitled Tour"}</div>
                              <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{trans?.description || "No description available."}</div>
                              {/* Render vehicle badges if configured */}
                              {svc.options && svc.options.some(o => o.vehicleType) && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {svc.options.filter(o => o.vehicleType).map((o, oIdx) => (
                                    <span
                                      key={oIdx}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[var(--bg-card)] text-[9px] font-bold text-slate-600 dark:text-slate-350"
                                    >
                                      {o.vehicleType === "sedan" ? "4-5 chỗ" :
                                        o.vehicleType === "suv" ? "7 chỗ" :
                                          o.vehicleType === "van" ? "16 chỗ" : "29-45 chỗ"}
                                      {o.seatCapacity ? ` (${o.seatCapacity} ghế)` : ""}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
                              <Compass size={12} />
                              {getCategoryName(svc.categoryId)}
                            </span>
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                            {(() => {
                              if (!svc.options || svc.options.length === 0) return "N/A";
                              const prices = svc.options.map(o => o.price);
                              const minPrice = Math.min(...prices);
                              const maxPrice = Math.max(...prices);
                              const formatter = new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                                maximumFractionDigits: 0
                              });
                              return minPrice === maxPrice ? formatter.format(minPrice) : `${formatter.format(minPrice)} - ${formatter.format(maxPrice)}`;
                            })()}
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4">
                            <StatusChip status={svc.status} type="publish" />
                          </Table.Cell>
                          <Table.Cell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Tooltip delay={300} closeDelay={100}>
                                <Tooltip.Trigger>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="tertiary"
                                    aria-label="Xem chi tiết"
                                    onPress={() => {
                                      setSelectedService(svc);
                                      setDetailsModalOpen(true);
                                    }}
                                  >
                                    <Eye size={16} />
                                  </Button>
                                </Tooltip.Trigger>
                                <Tooltip.Content>
                                  <Tooltip.Arrow />
                                  Xem chi tiết
                                </Tooltip.Content>
                              </Tooltip>

                              <Tooltip delay={300} closeDelay={100}>
                                <Tooltip.Trigger>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="secondary"
                                    aria-label="Chỉnh sửa"
                                    onPress={() => {
                                      setSelectedService(svc);
                                      setDetailsDefaultEditMode(true);
                                      setDetailsModalOpen(true);
                                    }}
                                  >
                                    <Edit3 size={16} />
                                  </Button>
                                </Tooltip.Trigger>
                                <Tooltip.Content>
                                  <Tooltip.Arrow />
                                  Chỉnh sửa
                                </Tooltip.Content>
                              </Tooltip>

                              <Tooltip delay={300} closeDelay={100}>
                                <Tooltip.Trigger>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="danger"
                                    aria-label="Xóa"
                                    onPress={() => {
                                      setSelectedService(svc);
                                      setDeleteModalOpen(true);
                                    }}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </Tooltip.Trigger>
                                <Tooltip.Content className="text-rose-600 dark:text-rose-400">
                                  <Tooltip.Arrow />
                                  Xóa
                                </Tooltip.Content>
                              </Tooltip>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </div>
        )}
      </div>

      {/* Render separated modals */}
      <ServiceDetailModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedService(null);
          setDetailsDefaultEditMode(false);
        }}
        service={selectedService}
        categories={categories}
        language={"vi"}
        backendUrl={backendUrl}
        onSaveSuccess={handleSaveSuccess}
        showToast={showToast}
        defaultEditMode={detailsDefaultEditMode}
      />

      <ServiceCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        categories={categories}
        language={"vi"}
        backendUrl={backendUrl}
        onSaveSuccess={handleSaveSuccess}
        showToast={showToast}
      />

      <ServiceDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedService(null);
        }}
        service={selectedService}
        language={"vi"}
        backendUrl={backendUrl}
        onDeleteSuccess={handleDeleteSuccess}
        showToast={showToast}
      />
    </div>
  );
}
