"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox,
  toast,
  Label,
  NumberField,
  ModalCloseTrigger,
} from "@heroui/react";
import { Settings2, X, Sparkles, TrendingUp, CheckCircle2, RefreshCw, Save } from "lucide-react";
import { getAdminTourConfig, updateAdminTourConfig, TourConfigDto } from "@/lib/api/tour-config";
import { useI18n } from "@/context/LanguageContext";

interface TourConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const TourConfigModal: React.FC<TourConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recommendedLimit, setRecommendedLimit] = useState<number>(6);
  const [autoRecommendEnabled, setAutoRecommendEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await getAdminTourConfig();
      if (res.data) {
        setRecommendedLimit(res.data.recommendedLimit ?? 6);
        setAutoRecommendEnabled(res.data.autoRecommendEnabled ?? true);
      }
    } catch (err: any) {
      toast.danger(err.message || "Failed to load tour config");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAdminTourConfig({
        recommendedLimit: Number(recommendedLimit) || 6,
        autoRecommendEnabled,
      });
      toast.success(t.tours.configUpdated || "Cập nhật cấu hình thành công");
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      toast.danger(err.message || "Failed to save tour config");
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

          <ModalDialog className="max-w-md bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent/10 text-accent">
                  <Settings2 size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {t.tours.tabConfig || "Cấu hình Tour"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Thuật toán tự động đề xuất & bán chạy
                  </p>
                </div>
              </div>
            </ModalHeader>

            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                {loading ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Đang tải cấu hình...</span>
                  </div>
                ) : (
                  <>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-3">
                      <Sparkles size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                        <p className="font-bold text-amber-700 dark:text-amber-400">
                          Xếp hạng đề xuất tự động
                        </p>
                        <p className="text-[11px] leading-relaxed">
                          Hệ thống tự động thống kê số lượt booking thành công và tổng doanh thu từ các đơn đặt tour để gắn nhãn <strong>Bán chạy / Đề xuất</strong> và ưu tiên hiển thị ở vị trí hàng đầu.
                        </p>
                      </div>
                    </div>

                    <div>
                      <NumberField
                        value={recommendedLimit}
                        onChange={(val) => setRecommendedLimit(Number(val) || 1)}
                        minValue={1}
                        maxValue={50}
                      >
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          {t.tours.recommendedLimit || "Số lượng tour đề xuất hiển thị"}
                        </Label>
                        <NumberField.Input
                          className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] px-3 text-xs font-semibold"
                        />
                      </NumberField>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Số lượng tour được ưu tiên xếp đầu danh sách và mang badge đề xuất (Mặc định: 6).
                      </span>
                    </div>

                    <div className="pt-2">
                      <Checkbox
                        isSelected={autoRecommendEnabled}
                        onChange={(checked) => setAutoRecommendEnabled(checked)}
                      >
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Content>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Bật tự động xếp hạng tour đề xuất theo lượt đặt & doanh thu
                          </span>
                        </Checkbox.Content>
                      </Checkbox>
                    </div>
                  </>
                )}
              </ModalBody>

              <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isDisabled={loading || saving}
                  className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                >
                  {saving ? <RefreshCw className="animate-spin mr-1.5" size={15} /> : <Save className="mr-1.5" size={15} />}
                  {t.tours.saveConfig || "Lưu cấu hình"}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
};
export default TourConfigModal;
