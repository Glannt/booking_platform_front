"use client";

import React from "react";
import TourCreateUpdateModal, { type TourCreateUpdateModalProps } from "./TourCreateUpdateModal";
import type { TourDto, TourCategoryDto } from "@/lib/api/tours";

export type { TourCreateUpdateModalProps };

export interface TourCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: TourCategoryDto[];
    language?: string;
    backendUrl?: string;
    onSaveSuccess: (newTour?: TourDto) => void | Promise<void>;
    showToast: (msg: string, type: "success" | "error") => void;
}

export default function TourCreateModal(props: TourCreateModalProps) {
    return <TourCreateUpdateModal {...props} editingTour={null} />;
}
