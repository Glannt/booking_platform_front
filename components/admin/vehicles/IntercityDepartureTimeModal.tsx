"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Clock, GripVertical, ArrowRight } from "lucide-react";
import {
  Button,
  Input,
  toast,
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalCloseTrigger,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
} from "@heroui/react";

import {
  getDepartureTimesByRoute,
  createDepartureTime,
  updateDepartureTime,
  deleteDepartureTime,
  type IntercityDepartureTimeDto,
} from "@/lib/api/intercity";

interface IntercityDepartureTimeModalProps {
  routeId: number;
  routeName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function IntercityDepartureTimeModal({
  routeId,
  routeName,
  isOpen,
  onClose,
}: IntercityDepartureTimeModalProps) {
  const [departureTimes, setDepartureTimes] = useState<IntercityDepartureTimeDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [direction, setDirection] = useState<"OUTBOUND" | "RETURN">("OUTBOUND");
  const [saving, setSaving] = useState(false);

  const fetchTimes = async () => {
    setLoading(true);
    try {
      const res = await getDepartureTimesByRoute(routeId);
      if (res.data) setDepartureTimes(res.data);
    } catch {
      toast.danger("Không thể tải giờ khởi hành.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && routeId) fetchTimes();
  }, [isOpen, routeId]);

  const handleAdd = async () => {
    if (!newTime.match(/^\d{2}:\d{2}$/)) {
      toast.danger("Giờ không hợp lệ. Định dạng: HH:MM (ví dụ: 08:00)");
      return;
    }
    setSaving(true);
    try {
      await createDepartureTime({
        routeId,
        departureTime: newTime,
        direction: direction,
        orderIndex: departureTimes.length + 1,
        active: true,
      });
      setNewTime("");
      await fetchTimes();
      toast.success(`Đã thêm giờ khởi hành cho ${direction === "OUTBOUND" ? "Chiều đi" : "Chiều về"}.`);
    } catch {
      toast.danger("Không thể thêm giờ khởi hành.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (dt: IntercityDepartureTimeDto) => {
    try {
      await updateDepartureTime(dt.id!, {
        ...dt,
        active: !dt.active,
      });
      await fetchTimes();
    } catch {
      toast.danger("Không thể cập nhật.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDepartureTime(id);
      await fetchTimes();
      toast.success("Đã xóa giờ khởi hành.");
    } catch {
      toast.danger("Không thể xóa.");
    }
  };

  const filteredTimes = departureTimes.filter(
    (dt) => (dt.direction || "OUTBOUND") === direction
  );

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      aria-labelledby="departure-time-title"
    >
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm">
        <ModalContainer size="sm">
          <ModalDialog className="bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl w-full max-w-md p-6 border border-border-secondary">
            <ModalCloseTrigger />
            <ModalHeader className="p-0 pb-4 border-b border-separator">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-accent" />
                <h3 id="departure-time-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Giờ xuất bến — {routeName}
                </h3>
              </div>
            </ModalHeader>

            <ModalBody className="p-0 py-4 space-y-4">
              {/* Direction Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-[var(--bg-card)] rounded-xl">
                <button
                  type="button"
                  onClick={() => setDirection("OUTBOUND")}
                  className={`py-2 px-3 rounded-lg text-xs font-black transition cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                    direction === "OUTBOUND"
                      ? "bg-white dark:bg-[var(--bg-surface)] text-accent shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white bg-transparent"
                  }`}
                >
                  <ArrowRight size={13} className="text-accent" />
                  <span>Chiều đi (Outbound)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("RETURN")}
                  className={`py-2 px-3 rounded-lg text-xs font-black transition cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                    direction === "RETURN"
                      ? "bg-white dark:bg-[var(--bg-surface)] text-amber-500 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white bg-transparent"
                  }`}
                >
                  <ArrowRight size={13} className="text-amber-500 rotate-180" />
                  <span>Chiều về (Return)</span>
                </button>
              </div>

              {/* Add new time for active direction */}
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="flex-1 border-1 border-separator"
                  placeholder="HH:MM"
                />
                <Button
                  onClick={handleAdd}
                  isDisabled={saving || !newTime}
                  className="rounded-xl font-bold text-xs h-10 px-4 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors flex items-center gap-1"
                >
                  <Plus size={14} />
                  Thêm
                </Button>
              </div>

              {/* List of times for active direction */}
              {loading ? (
                <div className="text-center py-8 text-sm text-slate-400">Đang tải...</div>
              ) : filteredTimes.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 italic bg-slate-50 dark:bg-[var(--bg-card)] rounded-xl border border-border">
                  Chưa có khung giờ cố định nào cho {direction === "OUTBOUND" ? "Chiều đi" : "Chiều về"}.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredTimes.map((dt) => (
                    <div
                      key={dt.id}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        dt.active
                          ? "border-border bg-white dark:bg-[var(--bg-card)]"
                          : "border-border bg-slate-50 dark:bg-[var(--bg-surface)] opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical size={14} className="text-slate-300" />
                        <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                          {dt.departureTime}
                        </span>
                        <Chip size="sm" variant="soft" className="text-[10px] font-bold">
                          {dt.direction === "RETURN" ? "Về" : "Đi"}
                        </Chip>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleActive(dt)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer border-none ${
                            dt.active
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-500 dark:bg-[var(--bg-elevated)] dark:text-slate-400"
                          }`}
                        >
                          {dt.active ? "Đang chạy" : "Tạm ngưng"}
                        </button>
                        <button
                          onClick={() => handleDelete(dt.id!)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer border-none bg-transparent"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Đóng
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
