"use client";

import React from "react";
import VehicleCreateUpdateModal, {
  VehicleCreateUpdateModalProps,
} from "./VehicleCreateUpdateModal";
import { VehicleCategoryDto, VehicleDto } from "@/lib/api/fleet";

export interface VehicleCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: VehicleCategoryDto[];
  language?: string;
  backendUrl?: string;
  onSaveSuccess: (newVehicle?: VehicleDto) => void | Promise<void>;
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function VehicleCreateModal(props: VehicleCreateModalProps) {
  return <VehicleCreateUpdateModal {...props} editingVehicle={null} />;
}
