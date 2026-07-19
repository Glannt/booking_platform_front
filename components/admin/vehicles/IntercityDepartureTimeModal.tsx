"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Clock, GripVertical } from "lucide-react";
import { Button, Input, Label, toast } from "@heroui/react";

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-accent" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Giờ khởi hành — {routeName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Add new time */}
        <div className="flex gap-2 mb-4">
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

        <div className="mt-5 flex justify-end">
          <Button onClick={onClose} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
