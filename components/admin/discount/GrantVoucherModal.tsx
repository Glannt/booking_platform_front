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
  Label,
  Input,
  TextField,
  Select,
  ListBox,
  NumberField,
  toast,
} from "@heroui/react";
import { Gift, RefreshCw, Send, Search } from "lucide-react";
import { grantPromotionToCustomer, type PromotionDto } from "@/lib/api/discount";
import { getUsers, type AdminUserDto } from "@/lib/api/users";
import { useI18n } from "@/context/LanguageContext";

interface GrantVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotion: PromotionDto | null;
  onGrantSuccess?: () => void;
}

export function GrantVoucherModal({
  isOpen,
  onClose,
  promotion,
  onGrantSuccess,
}: GrantVoucherModalProps) {
  const { t } = useI18n();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [reason, setReason] = useState<string>("MANUAL");
  const [expireDays, setExpireDays] = useState<number>(30);
  const [customCode, setCustomCode] = useState<string>("");

  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await getUsers({ search: userSearch || undefined, size: 50 });
        if (active && res.data?.content) {
          setUsers(res.data.content);
        }
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        if (active) setLoadingUsers(false);
      }
    };

    const timer = setTimeout(fetchUsers, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isOpen, userSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotion?.id) return;
    if (!selectedCustomerId) {
      toast.danger(t.discounts.selectCustomer);
      return;
    }

    setSubmitting(true);
    try {
      await grantPromotionToCustomer(promotion.id, {
        customerId: Number(selectedCustomerId),
        reason,
        expireDays: expireDays > 0 ? expireDays : undefined,
        customCode: customCode.trim() ? customCode.trim().toUpperCase() : undefined,
      });

      toast.success(t.discounts.grantSuccess);
      if (onGrantSuccess) onGrantSuccess();
      onClose();
    } catch (err) {
      toast.danger(err instanceof Error ? err.message : "Có lỗi xảy ra khi cấp mã");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px]">
        <ModalContainer>
          <ModalDialog className="max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <ModalCloseTrigger />
            <ModalHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                  <Gift size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {t.discounts.grantVoucher}
                  </h3>
                  <p className="text-xs text-slate-500 truncate max-w-xs">
                    {promotion?.name} ({promotion?.code})
                  </p>
                </div>
              </div>
            </ModalHeader>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
                {/* Search / Select Customer */}
                <div className="space-y-1.5">
                  <Label isRequired className="text-xs font-bold uppercase tracking-wider block">
                    {t.discounts.selectCustomer}
                  </Label>
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm theo email, tên, số điện thoại..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[var(--bg-card)] text-xs font-semibold outline-none focus:border-accent"
                    />
                  </div>

                  <Select
                    isRequired
                    aria-label={t.discounts.selectCustomer}
                    selectedKey={selectedCustomerId}
                    onSelectionChange={(key) => { if (key) setSelectedCustomerId(String(key)); }}
                    className="w-full"
                  >
                    <Select.Trigger className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] text-xs font-semibold flex items-center justify-between cursor-pointer w-full shadow-2xs">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50 w-[var(--trigger-width)] max-h-56 overflow-y-auto">
                      <ListBox>
                        {users.map((u) => (
                          <ListBox.Item key={u.id} id={String(u.id)} textValue={`${u.fullname || u.email} (${u.email})`}>
                            <div className="flex flex-col">
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                                {u.fullname || u.email}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {u.email} {u.phone ? `• ${u.phone}` : ""}
                              </span>
                            </div>
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                {/* Reason */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider block">
                    {t.discounts.grantReason}
                  </Label>
                  <Select
                    aria-label={t.discounts.grantReason}
                    selectedKey={reason}
                    onSelectionChange={(key) => { if (key) setReason(String(key)); }}
                    className="w-full"
                  >
                    <Select.Trigger className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] text-xs font-semibold flex items-center justify-between cursor-pointer w-full shadow-2xs">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-50 w-[var(--trigger-width)]">
                      <ListBox>
                        <ListBox.Item key="MANUAL" id="MANUAL" textValue="Thủ công (Tặng riêng)">
                          Thủ công (Tặng riêng)
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item key="COMPENSATION" id="COMPENSATION" textValue="Đền bù sự cố (Compensation)">
                          Đền bù sự cố (Compensation)
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item key="BIRTHDAY" id="BIRTHDAY" textValue="Ưu đãi Sinh nhật">
                          Ưu đãi Sinh nhật
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item key="LOYALTY_MILESTONE" id="LOYALTY_MILESTONE" textValue="Cột mốc trung thành">
                          Cột mốc trung thành
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item key="REFERRAL" id="REFERRAL" textValue="Giới thiệu bạn bè">
                          Giới thiệu bạn bè
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                {/* Expire Days */}
                <NumberField
                  minValue={1}
                  maxValue={365}
                  value={expireDays}
                  onChange={(val) => setExpireDays(typeof val === "number" ? val : 30)}
                  className="w-full"
                >
                  <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">
                    {t.discounts.expireDays}
                  </Label>
                  <NumberField.Group className="h-10 bg-white dark:bg-[var(--bg-surface)] border border-slate-200 dark:border-slate-800 rounded-xl">
                    <NumberField.DecrementButton />
                    <NumberField.Input className="font-semibold text-xs text-center" />
                    <NumberField.IncrementButton />
                  </NumberField.Group>
                </NumberField>

                {/* Custom Unique Code */}
                <TextField className="w-full">
                  <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">
                    {t.discounts.customCode}
                  </Label>
                  <Input
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                    placeholder="Để trống để hệ thống tự sinh mã riêng"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-surface)] font-mono text-xs font-bold uppercase"
                  />
                </TextField>
              </ModalBody>

              <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[var(--bg-surface)] flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  onClick={onClose}
                  isDisabled={submitting}
                  className="rounded-xl font-bold text-xs h-10 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[var(--bg-card)] hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {t.common.cancel}
                </Button>
                <Button
                  type="submit"
                  isDisabled={submitting || !selectedCustomerId}
                  className="rounded-xl font-bold text-xs h-10 px-5 bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm cursor-pointer border-none transition-colors"
                >
                  {submitting ? <RefreshCw size={15} className="animate-spin mr-1.5" /> : <Send size={15} className="mr-1.5" />}
                  {t.discounts.grantVoucher}
                </Button>
              </ModalFooter>
            </form>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
