"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalCloseTrigger,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Label,
  TextField,
  Checkbox,
  ComboBox,
  ListBox,
  EmptyState,
  toast,
  Typography,
} from "@heroui/react";
import {
  createSharedRoute,
  updateSharedRoute,
  DAYS_OF_WEEK,
  type SharedRouteDto,
  type SharedOfficeDto,
  type SharedRouteDirectionDto,
} from "@/lib/api/sharedRoute";
import {
  getActiveIntercityRoutes,
  type IntercityRouteDto,
} from "@/lib/api/intercity";
import { TimePicker, type TimeValue } from "@/components/time-picker";
import { Bus, Clock, Plus, Trash2, Link as LinkIcon, Calendar, X, RefreshCw, Save } from "lucide-react";

interface SharedRouteCreateUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void | Promise<void>;
  editingRoute?: SharedRouteDto | null;
  offices: SharedOfficeDto[];
}

interface ScheduleItemState {
  time: string;
  note: string;
  operatingDays: string[];
}

interface DirectionFormState {
  id?: number;
  originCity: string;
  destinationCity: string;
  price: string;
  distanceKm: string;
  estimatedHours: string;
  active: boolean;
  originOfficeIds: number[];
  destinationOfficeIds: number[];
  schedules: ScheduleItemState[];
}

const ALL_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const WEEKDAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const WEEKENDS = ["SATURDAY", "SUNDAY"];

export function SharedRouteCreateUpdateModal({
  isOpen,
  onClose,
  onSaveSuccess,
  editingRoute,
  offices,
}: SharedRouteCreateUpdateModalProps) {
  const [intercityRoutes, setIntercityRoutes] = useState<IntercityRouteDto[]>([]);
  const [linkedIntercityRouteId, setLinkedIntercityRouteId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [vehicleName, setVehicleName] = useState("Dcar Limousine 9 chỗ");
  const [active, setActive] = useState(true);
  const [activeTab, setActiveTab] = useState<"OUTBOUND" | "RETURN">("OUTBOUND");

  const getDefaultOutbound = (): DirectionFormState => ({
    originCity: "Nha Trang",
    destinationCity: "Đà Lạt",
    price: "250000",
    distanceKm: "135",
    estimatedHours: "3.5",
    active: true,
    originOfficeIds: [],
    destinationOfficeIds: [],
    schedules: [
      { time: "07:00:00", note: "Chuyến sáng", operatingDays: [...ALL_DAYS] },
      { time: "09:00:00", note: "Chuyến sáng", operatingDays: [...ALL_DAYS] },
      { time: "11:00:00", note: "Chuyến trưa", operatingDays: [...ALL_DAYS] },
      { time: "13:00:00", note: "Chuyến chiều", operatingDays: [...ALL_DAYS] },
      { time: "15:00:00", note: "Chuyến xế chiều", operatingDays: [...ALL_DAYS] },
      { time: "17:00:00", note: "Chuyến muộn", operatingDays: [...ALL_DAYS] },
    ],
  });

  const getDefaultReturnLeg = (): DirectionFormState => ({
    originCity: "Đà Lạt",
    destinationCity: "Nha Trang",
    price: "250000",
    distanceKm: "135",
    estimatedHours: "3.5",
    active: true,
    originOfficeIds: [],
    destinationOfficeIds: [],
    schedules: [
      { time: "07:00:00", note: "Chuyến sáng", operatingDays: [...ALL_DAYS] },
      { time: "09:00:00", note: "Chuyến sáng", operatingDays: [...ALL_DAYS] },
      { time: "11:00:00", note: "Chuyến trưa", operatingDays: [...ALL_DAYS] },
      { time: "13:00:00", note: "Chuyến chiều", operatingDays: [...ALL_DAYS] },
      { time: "15:00:00", note: "Chuyến xế chiều", operatingDays: [...ALL_DAYS] },
      { time: "17:00:00", note: "Chuyến muộn", operatingDays: [...ALL_DAYS] },
    ],
  });

  const [outbound, setOutbound] = useState<DirectionFormState>(getDefaultOutbound());
  const [returnLeg, setReturnLeg] = useState<DirectionFormState>(getDefaultReturnLeg());

  const [scheduleTimeValue, setScheduleTimeValue] = useState<TimeValue>({
    hour: 7,
    minute: 0,
    period: "AM",
  });
  const [saving, setSaving] = useState(false);

  // Fetch active intercity routes to allow linking
  useEffect(() => {
    if (isOpen) {
      getActiveIntercityRoutes()
        .then((res) => {
          const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
          if (Array.isArray(list)) setIntercityRoutes(list);
        })
        .catch(() => { });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (editingRoute) {
      setName(editingRoute.name || "");
      setVehicleName(editingRoute.vehicleName || "Dcar Limousine 9 chỗ");
      setActive(editingRoute.active ?? true);
      setLinkedIntercityRouteId(editingRoute.linkedIntercityRouteId ?? null);

      const outDir = editingRoute.directions?.find((d) => d.directionType === "OUTBOUND");
      if (outDir) {
        setOutbound({
          id: outDir.id,
          originCity: outDir.originCity || "Nha Trang",
          destinationCity: outDir.destinationCity || "Đà Lạt",
          price: String(outDir.price || 250000),
          distanceKm: outDir.distanceKm != null ? String(outDir.distanceKm) : "135",
          estimatedHours: outDir.estimatedHours != null ? String(outDir.estimatedHours) : "3.5",
          active: outDir.active ?? true,
          originOfficeIds: outDir.originOfficeIds || [],
          destinationOfficeIds: outDir.destinationOfficeIds || [],
          schedules: (outDir.schedules || []).map((s) => ({
            time: s.departureTime,
            note: s.note || "",
            operatingDays: s.operatingDays?.length ? [...s.operatingDays] : [...ALL_DAYS],
          })),
        });
      } else {
        setOutbound(getDefaultOutbound());
      }

      const retDir = editingRoute.directions?.find((d) => d.directionType === "RETURN");
      if (retDir) {
        setReturnLeg({
          id: retDir.id,
          originCity: retDir.originCity || "Đà Lạt",
          destinationCity: retDir.destinationCity || "Nha Trang",
          price: String(retDir.price || 250000),
          distanceKm: retDir.distanceKm != null ? String(retDir.distanceKm) : "135",
          estimatedHours: retDir.estimatedHours != null ? String(retDir.estimatedHours) : "3.5",
          active: retDir.active ?? true,
          originOfficeIds: retDir.originOfficeIds || [],
          destinationOfficeIds: retDir.destinationOfficeIds || [],
          schedules: (retDir.schedules || []).map((s) => ({
            time: s.departureTime,
            note: s.note || "",
            operatingDays: s.operatingDays?.length ? [...s.operatingDays] : [...ALL_DAYS],
          })),
        });
      } else {
        setReturnLeg(getDefaultReturnLeg());
      }
    } else {
      setName("");
      setVehicleName("Dcar Limousine 9 chỗ");
      setActive(true);
      setLinkedIntercityRouteId(null);
      setActiveTab("OUTBOUND");
      setOutbound(getDefaultOutbound());
      setReturnLeg(getDefaultReturnLeg());
    }
  }, [editingRoute, isOpen]);

  const currentDir = activeTab === "OUTBOUND" ? outbound : returnLeg;
  const setCurrentDir = activeTab === "OUTBOUND" ? setOutbound : setReturnLeg;

  const selectedOriginOffices = offices.filter((off) =>
    currentDir.originOfficeIds.includes(off.id!)
  );
  const selectedDestOffices = offices.filter((off) =>
    currentDir.destinationOfficeIds.includes(off.id!)
  );

  const handleLinkIntercityRoute = (routeIdStr: string) => {
    if (!routeIdStr || routeIdStr === "none") {
      setLinkedIntercityRouteId(null);
      return;
    }
    const routeId = Number(routeIdStr);
    if (isNaN(routeId) || routeId <= 0) {
      setLinkedIntercityRouteId(null);
      return;
    }
    setLinkedIntercityRouteId(routeId);

    const selected = intercityRoutes.find((r) => r.id === routeId);
    if (selected) {
      const generatedName = selected.originCity + " - " + selected.destinationCity;
      setName(generatedName);

      setOutbound((prev) => ({
        ...prev,
        originCity: selected.originCity,
        destinationCity: selected.destinationCity,
        distanceKm: selected.distanceKm != null ? String(selected.distanceKm) : prev.distanceKm,
        estimatedHours: selected.estimatedHours != null ? String(selected.estimatedHours) : prev.estimatedHours,
      }));

      setReturnLeg((prev) => ({
        ...prev,
        originCity: selected.destinationCity,
        destinationCity: selected.originCity,
        distanceKm: selected.distanceKm != null ? String(selected.distanceKm) : prev.distanceKm,
        estimatedHours: selected.estimatedHours != null ? String(selected.estimatedHours) : prev.estimatedHours,
      }));
    }
  };

  const handleAddSchedule = () => {
    const h24 = (scheduleTimeValue.hour % 12) + (scheduleTimeValue.period === "PM" ? 12 : 0);
    const formatted = `${String(h24).padStart(2, "0")}:${String(scheduleTimeValue.minute).padStart(2, "0")}:00`;

    if (currentDir.schedules.some((s) => s.time.substring(0, 5) === formatted.substring(0, 5))) {
      toast.danger(`Khung giờ ${formatted.substring(0, 5)} đã có trong lịch trình`);
      return;
    }

    setCurrentDir((prev) => ({
      ...prev,
      schedules: [
        ...prev.schedules,
        { time: formatted, note: "", operatingDays: [...ALL_DAYS] },
      ].sort((a, b) => a.time.localeCompare(b.time)),
    }));
  };

  const handleRemoveSchedule = (idx: number) => {
    setCurrentDir((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== idx),
    }));
  };

  const handleToggleScheduleDay = (scheduleIdx: number, dayKey: string) => {
    setCurrentDir((prev) => {
      const updatedSchedules = [...prev.schedules];
      const target = updatedSchedules[scheduleIdx];
      if (!target) return prev;

      const exists = target.operatingDays.includes(dayKey);
      const newDays = exists
        ? target.operatingDays.filter((d) => d !== dayKey)
        : [...target.operatingDays, dayKey];

      updatedSchedules[scheduleIdx] = {
        ...target,
        operatingDays: newDays,
      };

      return {
        ...prev,
        schedules: updatedSchedules,
      };
    });
  };

  const handleSetScheduleDaysPreset = (scheduleIdx: number, preset: "ALL" | "WEEKDAYS" | "WEEKENDS") => {
    setCurrentDir((prev) => {
      const updatedSchedules = [...prev.schedules];
      const target = updatedSchedules[scheduleIdx];
      if (!target) return prev;

      let newDays = [...ALL_DAYS];
      if (preset === "WEEKDAYS") newDays = [...WEEKDAYS];
      if (preset === "WEEKENDS") newDays = [...WEEKENDS];

      updatedSchedules[scheduleIdx] = {
        ...target,
        operatingDays: newDays,
      };

      return {
        ...prev,
        schedules: updatedSchedules,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.danger("Vui lòng nhập tên tuyến xe ghép.");
      return;
    }

    setSaving(true);
    try {
      const buildDirectionPayload = (
        state: DirectionFormState,
        type: "OUTBOUND" | "RETURN"
      ): SharedRouteDirectionDto => ({
        id: editingRoute?.id ? state.id : undefined,
        directionType: type,
        originCity: state.originCity.trim(),
        destinationCity: state.destinationCity.trim(),
        price: Number(state.price) || 250000,
        distanceKm: state.distanceKm ? Number(state.distanceKm) : null,
        estimatedHours: state.estimatedHours ? Number(state.estimatedHours) : null,
        active: state.active,
        originOfficeIds: state.originOfficeIds,
        destinationOfficeIds: state.destinationOfficeIds,
        schedules: state.schedules.map((s) => ({
          departureTime: s.time,
          note: s.note || undefined,
          operatingDays: s.operatingDays && s.operatingDays.length > 0 ? s.operatingDays : [...ALL_DAYS],
          active: true,
        })),
      });

      const payload: Partial<SharedRouteDto> = {
        name: name.trim(),
        vehicleName: vehicleName.trim(),
        active,
        linkedIntercityRouteId: linkedIntercityRouteId || null,
        directions: [
          buildDirectionPayload(outbound, "OUTBOUND"),
          buildDirectionPayload(returnLeg, "RETURN"),
        ],
      };

      if (editingRoute?.id) {
        await updateSharedRoute(editingRoute.id, payload);
        toast.success("Cập nhật tuyến xe ghép thành công!");
      } else {
        await createSharedRoute(payload);
        toast.success("Tạo tuyến xe ghép mới thành công!");
      }

      await onSaveSuccess?.();
      onClose();
    } catch {
      toast.danger("Có lỗi xảy ra khi lưu tuyến xe ghép.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-accent/10 text-accent">
                  <Bus size={20} />
                </div>
                <div>
                  <Typography type="h3" className="text-base font-bold text-foreground">
                    {editingRoute ? "Chỉnh sửa tuyến xe ghép" : "Thêm mới tuyến xe ghép"}
                  </Typography>
                  <p className="text-xs text-foreground/60">
                    Cấu hình tuyến xe ghép chỗ, chiều đi/về, văn phòng đón trả và lịch chạy theo thứ trong tuần
                  </p>
                </div>
              </div>
            </ModalHeader>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
                {/* Linked Intercity Route Section */}
                <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/40 rounded-2xl space-y-2">
                  <ComboBox
                    fullWidth
                    className="w-full"
                    allowsEmptyCollection
                    selectedKey={linkedIntercityRouteId ? String(linkedIntercityRouteId) : null}
                    onSelectionChange={(key) => {
                      handleLinkIntercityRoute(key ? String(key) : "");
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 cursor-pointer">
                        <LinkIcon size={14} className="text-accent" />
                        <span>Liên kết với Tuyến xe riêng liên tỉnh (Tùy chọn)</span>
                      </Label>
                      {linkedIntercityRouteId && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            Đã kết nối
                          </span>
                          <button
                            type="button"
                            onClick={() => handleLinkIntercityRoute("")}
                            className="text-[11px] font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer flex items-center gap-0.5"
                            title="Hủy liên kết để tự nhập thủ công"
                          >
                            <X size={12} />
                            <span>Hủy liên kết</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <ComboBox.InputGroup>
                      <Input
                        className="w-full text-xs font-semibold bg-white dark:bg-[var(--bg-surface)] outline-none text-foreground placeholder:text-foreground/50 border-none p-2 focus:ring-0"
                        placeholder="Tìm hoặc chọn tuyến xe riêng liên tỉnh..."
                      />
                      {linkedIntercityRouteId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLinkIntercityRoute("");
                          }}
                          className="p-1 text-foreground/50 hover:text-red-500 rounded-md cursor-pointer mr-1 shrink-0"
                          title="Hủy liên kết"
                        >
                          <X size={14} />
                        </button>
                      )}
                      <ComboBox.Trigger className="cursor-pointer text-foreground/50 hover:text-foreground shrink-0" />
                    </ComboBox.InputGroup>

                    <ComboBox.Popover className="w-[var(--trigger-width)] max-w-[var(--trigger-width)] bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50">
                      <ListBox
                        className="max-h-60 overflow-y-auto w-full"
                        renderEmptyState={() => (
                          <EmptyState className="text-xs p-3 text-center text-foreground/50">
                            Không tìm thấy tuyến xe nào
                          </EmptyState>
                        )}
                      >
                        <ListBox.Item
                          id="none"
                          textValue="-- Không liên kết tuyến xe riêng --"
                          className="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-foreground/70 flex items-center justify-between"
                        >
                          <span>-- Tự nhập thủ công (Không liên kết) --</span>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        {intercityRoutes.map((r) => {
                          const routeName = `${r.originCity} - ${r.destinationCity}`;
                          return (
                            <ListBox.Item
                              key={r.id}
                              id={String(r.id)}
                              textValue={routeName}
                              className="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-foreground flex items-center justify-between"
                            >
                              <div className="flex flex-col">
                                <span className="font-bold">{routeName}</span>
                                {r.slug && (
                                  <span className="text-[10px] text-foreground/50 font-normal">
                                    /intercity/{r.slug}
                                  </span>
                                )}
                              </div>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          );
                        })}
                      </ListBox>
                    </ComboBox.Popover>
                  </ComboBox>

                  <p className="text-[11px] text-foreground/60">
                    Khi liên kết, trang chi tiết tuyến xe riêng <code>/intercity/[slug]</code> sẽ tự động hiển thị tab đặt vé xe ghép này.
                  </p>
                </div>

                {/* General Route Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField isRequired className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs font-bold uppercase tracking-wider block text-foreground">
                        Tên tuyến xe ghép
                      </Label>
                      {linkedIntercityRouteId && (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          (Tự động theo tuyến liên kết)
                        </span>
                      )}
                    </div>
                    <Input
                      placeholder="Ví dụ: Nha Trang - Đà Lạt"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={Boolean(linkedIntercityRouteId)}
                      className={`px-3 py-2 border border-separator rounded-xl text-sm w-full ${linkedIntercityRouteId
                        ? "bg-slate-100 dark:bg-[var(--bg-card)] text-foreground/60 cursor-not-allowed font-medium opacity-80"
                        : "bg-white dark:bg-[var(--bg-surface)] text-foreground"
                        }`}
                    />
                  </TextField>

                  <TextField className="w-full">
                    <Label className="text-xs font-bold uppercase tracking-wider mb-1 block text-foreground">
                      Dòng xe vận hành
                    </Label>
                    <Input
                      placeholder="Ví dụ: Dcar Limousine 9 chỗ"
                      value={vehicleName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVehicleName(e.target.value)}
                      className="px-3 py-2 border border-separator rounded-xl text-sm w-full bg-white dark:bg-[var(--bg-surface)] text-foreground"
                    />
                  </TextField>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="route-active"
                    isSelected={active}
                    onChange={(val: boolean) => setActive(val)}
                  >
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                  <Label htmlFor="route-active" className="text-sm font-extrabold cursor-pointer select-none text-foreground">
                    Kích hoạt tuyến xe này
                  </Label>
                </div>

                {/* Direction Tabs */}
                <div className="border-t border-separator/70 pt-4">
                  <Label className="text-xs font-bold uppercase tracking-wider mb-2 block text-foreground/80">
                    Cấu hình chiều di chuyển
                  </Label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-[var(--bg-card)] rounded-xl border border-border">
                    <button
                      type="button"
                      onClick={() => setActiveTab("OUTBOUND")}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "OUTBOUND"
                        ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-sm border border-border"
                        : "text-foreground/70 hover:text-foreground"
                        }`}
                    >
                      Chiều đi
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("RETURN")}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "RETURN"
                        ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-sm border border-border"
                        : "text-foreground/70 hover:text-foreground"
                        }`}
                    >
                      Chiều về
                    </button>
                  </div>
                </div>

                {/* Direction Specific Fields */}
                <div className="p-4 bg-slate-50 dark:bg-[var(--bg-card)] rounded-xl border border-border space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <TextField isRequired className="w-full">
                      <Label className="text-xs font-bold uppercase tracking-wider mb-1 block text-foreground">
                        Thành phố đi
                      </Label>
                      <Input
                        value={currentDir.originCity}
                        onChange={(e) =>
                          setCurrentDir((f) => ({ ...f, originCity: e.target.value }))
                        }
                        className="px-3 py-2 border border-separator rounded-xl text-sm w-full bg-white dark:bg-[var(--bg-surface)] text-foreground"
                      />
                    </TextField>

                    <TextField isRequired className="w-full">
                      <Label className="text-xs font-bold uppercase tracking-wider mb-1 block text-foreground">
                        Thành phố đến
                      </Label>
                      <Input
                        value={currentDir.destinationCity}
                        onChange={(e) =>
                          setCurrentDir((f) => ({ ...f, destinationCity: e.target.value }))
                        }
                        className="px-3 py-2 border border-separator rounded-xl text-sm w-full bg-white dark:bg-[var(--bg-surface)] text-foreground"
                      />
                    </TextField>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <TextField isRequired className="w-full">
                      <Label className="text-xs font-bold uppercase tracking-wider mb-1 block text-foreground">
                        Giá vé / người (VND)
                      </Label>
                      <Input
                        type="number"
                        value={currentDir.price}
                        onChange={(e) =>
                          setCurrentDir((f) => ({ ...f, price: e.target.value }))
                        }
                        className="px-3 py-2 border border-separator rounded-xl text-sm w-full bg-white dark:bg-[var(--bg-surface)] text-foreground"
                      />
                    </TextField>

                    <TextField className="w-full">
                      <Label className="text-xs font-bold uppercase tracking-wider mb-1 block text-foreground">
                        Khoảng cách (km)
                      </Label>
                      <Input
                        type="number"
                        value={currentDir.distanceKm}
                        onChange={(e) =>
                          setCurrentDir((f) => ({ ...f, distanceKm: e.target.value }))
                        }
                        className="px-3 py-2 border border-separator rounded-xl text-sm w-full bg-white dark:bg-[var(--bg-surface)] text-foreground"
                      />
                    </TextField>

                    <TextField className="w-full">
                      <Label className="text-xs font-bold uppercase tracking-wider mb-1 block text-foreground">
                        Thời gian (giờ)
                      </Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={currentDir.estimatedHours}
                        onChange={(e) =>
                          setCurrentDir((f) => ({ ...f, estimatedHours: e.target.value }))
                        }
                        className="px-3 py-2 border border-separator rounded-xl text-sm w-full bg-white dark:bg-[var(--bg-surface)] text-foreground"
                      />
                    </TextField>
                  </div>

                  {/* Origin Offices Selection */}
                  <div className="space-y-1.5">
                    <ComboBox
                      className="w-full"
                      selectionMode="multiple"
                      value={currentDir.originOfficeIds.map(String)}
                      onChange={(keys) => {
                        const ids = Array.from(keys ?? []).map(Number).filter((n) => !isNaN(n) && n > 0);
                        setCurrentDir((prev) => ({ ...prev, originOfficeIds: ids }));
                      }}
                    >
                      <Label className="text-xs font-bold uppercase tracking-wider block text-foreground/80">
                        Văn phòng đón đầu đi
                      </Label>
                      <ComboBox.InputGroup className="w-full">
                        <Input placeholder="Tìm kiếm văn phòng đón..." className="w-full text-xs text-foreground placeholder:text-foreground/50" />
                        <ComboBox.Trigger />
                      </ComboBox.InputGroup>

                      {/* Khung hiển thị các văn phòng đón đã chọn */}
                      <div className="mt-1.5 p-2 rounded-xl border border-separator bg-white dark:bg-[var(--bg-surface)] min-h-[38px] flex items-center shadow-2xs">
                        {selectedOriginOffices.length === 0 ? (
                          <span className="text-xs text-foreground/50 italic px-1">
                            Chưa chọn văn phòng đón
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 w-full">
                            {selectedOriginOffices.map((off) => (
                              <span
                                key={off.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-accent/10 dark:bg-accent/20 border border-accent/30 text-accent"
                              >
                                <span>{off.name}</span>
                                <span className="text-[10px] font-medium opacity-90 capitalize">({off.city})</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setCurrentDir((prev) => ({
                                      ...prev,
                                      originOfficeIds: prev.originOfficeIds.filter((id) => id !== off.id),
                                    }));
                                  }}
                                  className="hover:text-red-500 cursor-pointer transition-colors ml-0.5"
                                  title="Bỏ chọn"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <ComboBox.Popover className="w-[var(--trigger-width)] max-w-[var(--trigger-width)] bg-white dark:bg-[var(--bg-surface)] border border-separator rounded-xl shadow-xl p-1 z-50">
                        <ListBox
                          selectionMode="multiple"
                          className="max-h-56 overflow-y-auto w-full p-1"
                          renderEmptyState={() => (
                            <EmptyState className="p-3 text-xs text-foreground/60 text-center">
                              {offices.length === 0 ? "Chưa có văn phòng trong hệ thống" : "Không tìm thấy văn phòng"}
                            </EmptyState>
                          )}
                        >
                          {offices.map((off) => (
                            <ListBox.Item
                              key={off.id}
                              id={String(off.id)}
                              textValue={`${off.name} (${off.city})`}
                              className="flex items-center justify-between px-3 py-2 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] rounded-lg cursor-pointer text-xs outline-none"
                            >
                              <div className="flex flex-col text-left">
                                <span className="font-semibold text-xs text-foreground">{off.name}</span>
                                <span className="text-[11px] font-medium text-accent capitalize">({off.city})</span>
                              </div>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </ComboBox.Popover>
                    </ComboBox>
                  </div>

                  {/* Destination Offices Selection */}
                  <div className="space-y-1.5">
                    <ComboBox
                      className="w-full"
                      selectionMode="multiple"
                      value={currentDir.destinationOfficeIds.map(String)}
                      onChange={(keys) => {
                        const ids = Array.from(keys ?? []).map(Number).filter((n) => !isNaN(n) && n > 0);
                        setCurrentDir((prev) => ({ ...prev, destinationOfficeIds: ids }));
                      }}
                    >
                      <Label className="text-xs font-bold uppercase tracking-wider block text-foreground/80">
                        Văn phòng trả đầu đến
                      </Label>
                      <ComboBox.InputGroup className="w-full">
                        <Input placeholder="Tìm kiếm văn phòng trả..." className="w-full text-xs text-foreground placeholder:text-foreground/50" />
                        <ComboBox.Trigger />
                      </ComboBox.InputGroup>

                      {/* Khung hiển thị các văn phòng trả đã chọn */}
                      <div className="mt-1.5 p-2 rounded-xl border border-border bg-white dark:bg-[var(--bg-surface)] min-h-[38px] flex items-center shadow-2xs">
                        {selectedDestOffices.length === 0 ? (
                          <span className="text-xs text-foreground/50 italic px-1">
                            Chưa chọn văn phòng trả
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 w-full">
                            {selectedDestOffices.map((off) => (
                              <span
                                key={off.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-accent/10 dark:bg-accent/20 border border-accent/30 text-accent"
                              >
                                <span>{off.name}</span>
                                <span className="text-[10px] font-medium opacity-90 capitalize">({off.city})</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setCurrentDir((prev) => ({
                                      ...prev,
                                      destinationOfficeIds: prev.destinationOfficeIds.filter((id) => id !== off.id),
                                    }));
                                  }}
                                  className="hover:text-red-500 cursor-pointer transition-colors ml-0.5"
                                  title="Bỏ chọn"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <ComboBox.Popover className="w-[var(--trigger-width)] max-w-[var(--trigger-width)] bg-white dark:bg-[var(--bg-surface)] border border-separator rounded-xl shadow-xl p-1 z-50">
                        <ListBox
                          selectionMode="multiple"
                          className="max-h-56 overflow-y-auto w-full p-1"
                          renderEmptyState={() => (
                            <EmptyState className="p-3 text-xs text-foreground/60 text-center">
                              {offices.length === 0 ? "Chưa có văn phòng trong hệ thống" : "Không tìm thấy văn phòng"}
                            </EmptyState>
                          )}
                        >
                          {offices.map((off) => (
                            <ListBox.Item
                              key={off.id}
                              id={String(off.id)}
                              textValue={`${off.name} (${off.city})`}
                              className="flex items-center justify-between px-3 py-2 hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] rounded-lg cursor-pointer text-xs outline-none"
                            >
                              <div className="flex flex-col text-left">
                                <span className="font-semibold text-xs text-foreground">{off.name}</span>
                                <span className="text-[11px] font-medium text-accent capitalize">({off.city})</span>
                              </div>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </ComboBox.Popover>
                    </ComboBox>
                  </div>

                  {/* Schedules (Departure Times & Operating Days) */}
                  <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider block text-foreground/80">
                        Khung giờ khởi hành & Ngày chạy
                      </Label>
                    </div>

                    <div className="space-y-2.5">
                      {currentDir.schedules.map((sch, idx) => {
                        const isAllDays = ALL_DAYS.every((d) => sch.operatingDays.includes(d));
                        const isWeekdays = WEEKDAYS.every((d) => sch.operatingDays.includes(d)) && !sch.operatingDays.includes("SATURDAY") && !sch.operatingDays.includes("SUNDAY");
                        const isWeekends = sch.operatingDays.includes("SATURDAY") && sch.operatingDays.includes("SUNDAY") && sch.operatingDays.length === 2;

                        return (
                          <div
                            key={idx}
                            className="p-3 bg-white dark:bg-[var(--bg-surface)] border border-border rounded-xl space-y-2 shadow-xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-accent/10 text-accent">
                                  <Clock size={14} />
                                </div>
                                <span className="font-extrabold text-sm text-foreground">
                                  {sch.time.substring(0, 5)}
                                </span>
                                {isAllDays && (
                                  <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                    Hàng ngày
                                  </span>
                                )}
                                {isWeekdays && (
                                  <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                                    Thứ 2 - Thứ 6
                                  </span>
                                )}
                                {isWeekends && (
                                  <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                                    Cuối tuần (T7, CN)
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveSchedule(idx)}
                                className="text-red-400 hover:text-red-600 p-1 cursor-pointer transition-colors"
                                title="Xóa khung giờ"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            {/* Day of week buttons */}
                            <div className="flex flex-wrap items-center gap-1 pt-1">
                              <span className="text-[10px] font-bold text-foreground/50 mr-1">Chạy vào:</span>
                              {DAYS_OF_WEEK.map((d) => {
                                const activeDay = sch.operatingDays.includes(d.key);
                                return (
                                  <button
                                    key={d.key}
                                    type="button"
                                    onClick={() => handleToggleScheduleDay(idx, d.key)}
                                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all cursor-pointer border ${activeDay
                                      ? "bg-accent text-accent-foreground border-accent shadow-xs"
                                      : "bg-slate-50 dark:bg-[var(--bg-card)] text-foreground/50 border-border hover:border-accent/40"
                                      }`}
                                    title={d.labelVi}
                                  >
                                    {d.shortVi}
                                  </button>
                                );
                              })}

                              {/* Quick Presets */}
                              <div className="flex items-center gap-1 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => handleSetScheduleDaysPreset(idx, "ALL")}
                                  className="text-[10px] font-bold text-foreground/60 hover:text-accent px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer"
                                >
                                  Tất cả
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetScheduleDaysPreset(idx, "WEEKDAYS")}
                                  className="text-[10px] font-bold text-foreground/60 hover:text-accent px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer"
                                >
                                  T2-T6
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetScheduleDaysPreset(idx, "WEEKENDS")}
                                  className="text-[10px] font-bold text-foreground/60 hover:text-accent px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-[var(--bg-card)] cursor-pointer"
                                >
                                  T7-CN
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-40">
                        <TimePicker
                          value={scheduleTimeValue}
                          onChange={setScheduleTimeValue}
                          popoverTitle="Chọn giờ xuất phát"
                          triggerClassName="h-10 bg-white dark:bg-[var(--bg-surface)] border border-separator rounded-xl px-3 text-xs"
                        />
                      </div>
                      <Button
                        size="sm"
                        type="button"
                        onClick={handleAddSchedule}
                        className="h-10 bg-accent/10 text-accent font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer hover:bg-accent/20 shrink-0 px-3"
                      >
                        <Plus size={14} /> Thêm giờ
                      </Button>
                    </div>
                  </div>
                </div>
              </ModalBody>

              <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  isDisabled={saving}
                  className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-foreground/80 transition-colors cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isDisabled={saving}
                  className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                >
                  {saving ? (
                    <RefreshCw size={15} className="animate-spin mr-1.5" />
                  ) : (
                    <Save size={15} className="mr-1.5" />
                  )}
                  Lưu tuyến xe
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}

export { SharedRouteCreateUpdateModal as SharedRouteModal };
export default SharedRouteCreateUpdateModal;
