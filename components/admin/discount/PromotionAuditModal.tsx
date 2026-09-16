"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Chip,
  Table,
} from "@heroui/react";
import { History, Users, RefreshCw } from "lucide-react";
import {
  getPromotionGrants,
  getPromotionRedemptions,
  type PromotionDto,
  type PromotionGrantDto,
  type PromotionRedemptionDto,
} from "@/lib/api/discount";
import { useI18n } from "@/context/LanguageContext";

interface PromotionAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotion: PromotionDto | null;
}

export function PromotionAuditModal({
  isOpen,
  onClose,
  promotion,
}: PromotionAuditModalProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"grants" | "redemptions">("grants");
  const [grants, setGrants] = useState<PromotionGrantDto[]>([]);
  const [redemptions, setRedemptions] = useState<PromotionRedemptionDto[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!promotion?.id) return;
    setLoading(true);
    try {
      if (activeTab === "grants") {
        const res = await getPromotionGrants(promotion.id);
        if (res.data) setGrants(res.data);
      } else {
        const res = await getPromotionRedemptions(promotion.id);
        if (res.data) setRedemptions(res.data);
      }
    } catch (err) {
      console.error("Failed to load audit data:", err);
    } finally {
      setLoading(false);
    }
  }, [promotion?.id, activeTab]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {promotion?.name} ({promotion?.code})
                  </h3>
                  <p className="text-xs text-slate-500">{t.discounts.description}</p>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex p-1 bg-slate-100 dark:bg-[var(--bg-card)] rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("grants")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                    activeTab === "grants"
                      ? "bg-accent text-accent-foreground shadow-xs"
                      : "text-slate-600 dark:text-slate-400 bg-transparent hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Users size={13} />
                  {t.discounts.grantsList}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("redemptions")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                    activeTab === "redemptions"
                      ? "bg-accent text-accent-foreground shadow-xs"
                      : "text-slate-600 dark:text-slate-400 bg-transparent hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <History size={13} />
                  {t.discounts.redemptionsList}
                </button>
              </div>
            </ModalHeader>

            <ModalBody className="p-6 overflow-y-auto max-h-[65vh]">
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2 opacity-50" />
                  Đang tải dữ liệu...
                </div>
              ) : activeTab === "grants" ? (
                grants.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 italic">
                    Chưa có khách hàng nào được cấp mã này
                  </div>
                ) : (
                  <Table aria-label="Grants Table" className="w-full">
                    <Table.ScrollContainer>
                      <Table.Content className="w-full text-xs">
                        <Table.Header className="bg-slate-50 dark:bg-[var(--bg-card)] font-bold border-b border-slate-200 dark:border-slate-800">
                          <Table.Column>Khách hàng</Table.Column>
                          <Table.Column>Mã riêng</Table.Column>
                          <Table.Column>Lý do</Table.Column>
                          <Table.Column>Hạn dùng</Table.Column>
                          <Table.Column>Trạng thái</Table.Column>
                        </Table.Header>
                        <Table.Body className="divide-y divide-slate-100 dark:divide-slate-800">
                          {grants.map((g) => (
                            <Table.Row key={g.id}>
                              <Table.Cell>
                                <div>
                                  <span className="font-bold block text-slate-900 dark:text-white">
                                    {g.customerName || `Customer #${g.customerId}`}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    {g.customerEmail || ""}
                                  </span>
                                </div>
                              </Table.Cell>
                              <Table.Cell>
                                <span className="font-mono font-bold uppercase text-accent">
                                  {g.uniqueCode}
                                </span>
                              </Table.Cell>
                              <Table.Cell>
                                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                  {g.grantedReason}
                                </span>
                              </Table.Cell>
                              <Table.Cell>
                                <span className="text-[11px] text-slate-500">
                                  {g.expiresAt ? g.expiresAt.slice(0, 10) : "Vô hạn"}
                                </span>
                              </Table.Cell>
                              <Table.Cell>
                                <Chip
                                  size="sm"
                                  variant="soft"
                                  color={g.used ? "default" : "success"}
                                  className="font-bold text-[10px]"
                                >
                                  {g.used ? "Đã dùng" : "Chưa dùng"}
                                </Chip>
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Content>
                    </Table.ScrollContainer>
                  </Table>
                )
              ) : redemptions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 italic">
                  Chưa có lượt sử dụng nào được ghi nhận
                </div>
              ) : (
                <Table aria-label="Redemptions Table" className="w-full">
                  <Table.ScrollContainer>
                    <Table.Content className="w-full text-xs">
                      <Table.Header className="bg-slate-50 dark:bg-[var(--bg-card)] font-bold border-b border-slate-200 dark:border-slate-800">
                        <Table.Column>Đơn hàng</Table.Column>
                        <Table.Column>Khách hàng</Table.Column>
                        <Table.Column>Số tiền giảm</Table.Column>
                        <Table.Column>Thời gian</Table.Column>
                        <Table.Column>Trạng thái</Table.Column>
                      </Table.Header>
                      <Table.Body className="divide-y divide-slate-100 dark:divide-slate-800">
                        {redemptions.map((r) => (
                          <Table.Row key={r.id}>
                            <Table.Cell>
                              <span className="font-mono font-bold text-accent">
                                #{r.orderId}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="font-mono text-slate-600 dark:text-slate-300">
                                Customer #{r.customerId}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                - {Number(r.discountAmount).toLocaleString("vi-VN")} VND
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="text-[11px] text-slate-500">
                                {r.redeemedAt ? r.redeemedAt.slice(0, 16).replace("T", " ") : ""}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <Chip
                                size="sm"
                                variant="soft"
                                color={r.status === "APPLIED" ? "success" : "danger"}
                                className="font-bold text-[10px]"
                              >
                                {r.status}
                              </Chip>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Content>
                  </Table.ScrollContainer>
                </Table>
              )}
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end shrink-0">
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {t.common.close}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
