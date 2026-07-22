"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Clock, GripVertical } from "lucide-react";
import { Button, Input, Label, toast, Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";

import {
  getDepartureTimesByRoute,
  createDepartureTime,
  updateDepartureTime,
  deleteDepartureTime,
  type IntercityDepartureTimeDto,
} from "@/lib/api/rental";

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
      toast.danger("Giờ không hợp lệ. Định dạng: HH:MM");
      return;
    }
    setSaving(true);
    try {
      await createDepartureTime({
        routeId,
        departureTime: newTime,
        orderIndex: departureTimes.length + 1,
        active: true,
      });
      setNewTime("");
      await fetchTimes();
      toast.success("Đã thêm giờ khởi hành.");
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

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="departure-time-title">
      <ModalBackdrop className="bg-slate-950/40 backdrop-blur-sm">
        <ModalContainer size="sm">
          <ModalDialog className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <ModalHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-accent" />
                <h3 id="departure-time-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Giờ khởi hành — {routeName}
                </h3>
              </div>
            </ModalHeader>

            <ModalBody className="p-0 py-4 space-y-4">
              {/* Add new time */}
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="flex-1"
                  placeholder="HH:MM"
                />
                <Button
                  onClick={handleAdd}
                  isDisabled={saving || !newTime}
                  className="bg-[#C9A227] hover:bg-[#B8911F] text-white border-none"
                >
                  <Plus size={14} />
                  Thêm
                </Button>
              </div>

              {/* List of times */}
              {loading ? (
                <div className="text-center py-8 text-sm text-slate-400">Đang tải...</div>
              ) : departureTimes.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400">
                  Chưa có giờ khởi hành nào.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {departureTimes.map((dt) => (
                    <div
                      key={dt.id}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        dt.active
                          ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                          : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical size={14} className="text-slate-300" />
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {dt.departureTime}
                        </span>
                        <span className="text-[10px] text-slate-400">#{dt.orderIndex}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleActive(dt)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer ${
                            dt.active
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {dt.active ? "Active" : "Off"}
                        </button>
                        <button
                          onClick={() => handleDelete(dt.id!)}
                          className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ModalBody>

            <ModalFooter className="p-0 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button onClick={onClose} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Đóng
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
