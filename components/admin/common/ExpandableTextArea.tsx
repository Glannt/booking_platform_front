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
    TextArea,
    ModalCloseTrigger,
} from "@heroui/react";
import { Maximize2, X, Check } from "lucide-react";

interface ExpandableTextAreaProps {
    label?: React.ReactNode;
    helperText?: React.ReactNode;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
    textareaClassName?: string;
    modalTitle?: string;
    language?: string;
}

export default function ExpandableTextArea({
    label,
    helperText,
    value,
    onChange,
    placeholder,
    rows = 3,
    className = "",
    textareaClassName = "",
    modalTitle,
    language = "vi",
}: ExpandableTextAreaProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [draftValue, setDraftValue] = useState(value);

    // Sync draft with value when modal opens
    useEffect(() => {
        if (isOpen) {
            setDraftValue(value);
        }
    }, [isOpen, value]);

    const handleApply = () => {
        onChange(draftValue);
        setIsOpen(false);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    // Calculate line and character counts
    const lineCount = (draftValue ? draftValue.split("\n").length : 0);
    const charCount = draftValue.length;

    return (
        <div className={className}>
            {/* Header: Label + Expand Button */}
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex-1 min-w-0">{label}</div>
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onPress={() => setIsOpen(true)}
                    className="h-7 px-2.5 text-xs font-semibold flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[var(--bg-elevated)] rounded-lg transition-colors cursor-pointer shrink-0"
                    aria-label={language === "vi" ? "Phóng to khung soạn thảo" : "Expand editor"}
                >
                    <Maximize2 size={13} />
                    <span>{language === "vi" ? "Phóng to" : "Expand"}</span>
                </Button>
            </div>

            {/* Optional Helper Text */}
            {helperText}

            {/* Standard TextArea */}
            <TextArea
                rows={rows}
                className={textareaClassName || "w-full border-1 border-separator text-slate-800 dark:text-slate-100 text-xs font-semibold"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />

            {/* Expanded Modal */}
            <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
                <ModalBackdrop className="bg-slate-950/45 backdrop-blur-[2px] z-[9999]">
                    <ModalContainer>
                        <ModalDialog className="max-w-3xl w-full max-h-[90vh] flex flex-col bg-white dark:bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-border-secondary overflow-hidden">
                            <ModalCloseTrigger />
                            <ModalHeader className="px-6 py-4 border-b border-separator flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Maximize2 size={16} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                                            {modalTitle || (language === "vi" ? "Soạn thảo nội dung chi tiết" : "Edit Content")}
                                        </h3>
                                        <p className="text-[11px] text-slate-400">
                                            {language === "vi"
                                                ? "Khung soạn thảo mở rộng giúp dễ dàng nhập và quản lý danh sách"
                                                : "Expanded editor for convenient list management"}
                                        </p>
                                    </div>
                                </div>
                            </ModalHeader>

                            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                <ModalBody className="p-6 space-y-4 overflow-y-auto max-h-[60vh] flex flex-col flex-1">
                                    {helperText && (
                                        <div className="p-3 bg-slate-50 dark:bg-[var(--bg-card)] rounded-xl border border-divider text-xs text-slate-600 dark:text-slate-300">
                                            {helperText}
                                        </div>
                                    )}

                                    <div className="flex-1 flex flex-col min-h-[280px]">
                                        <textarea
                                            value={draftValue}
                                            onChange={(e) => setDraftValue(e.target.value)}
                                            placeholder={placeholder}
                                            className="w-full flex-1 min-h-[260px] p-4 rounded-xl border-1 border-separator bg-slate-50 dark:bg-[var(--bg-card)] text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-primary leading-relaxed resize-y"
                                            autoFocus
                                        />
                                    </div>

                                    {/* Footer stats */}
                                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                                        <span>
                                            {language === "vi"
                                                ? `Số dòng: ${lineCount} | Ký tự: ${charCount}`
                                                : `Lines: ${lineCount} | Characters: ${charCount}`}
                                        </span>
                                        <span className="italic">
                                            {language === "vi" ? "Gợi ý: Mỗi dòng bắt đầu bằng '-' để tự định dạng danh sách" : "Tip: Start each line with '-' for bullet points"}
                                        </span>
                                    </div>
                                </ModalBody>

                                <ModalFooter className="px-6 py-4 border-t border-separator flex items-center justify-end gap-2 shrink-0">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onPress={handleClose}
                                        className="px-4 py-2 text-xs font-bold rounded-xl cursor-pointer"
                                    >
                                        {language === "vi" ? "Hủy" : "Cancel"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onPress={handleApply}
                                        className="px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Check size={14} />
                                        <span>{language === "vi" ? "Xong / Áp dụng" : "Done / Apply"}</span>
                                    </Button>
                                </ModalFooter>
                            </div>
                        </ModalDialog>
                    </ModalContainer>
                </ModalBackdrop>
            </Modal>
        </div>
    );
}
