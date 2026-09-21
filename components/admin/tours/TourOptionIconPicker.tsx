"use client";

import React from "react";
import { SvgIconPickerField } from "@/components/common/SvgIconPickerField";

interface TourOptionIconPickerProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  compact?: boolean;
}

export function TourOptionIconPicker({
  value,
  onChange,
  language,
  compact = false
}: TourOptionIconPickerProps) {
  return (
    <SvgIconPickerField
      value={value}
      onChange={onChange}
      compact={compact}
      label={language === "vi" ? "Icon biểu tượng (Raw SVG text)" : "Option Icon (Raw SVG text)"}
      placeholder={language === "vi" ? "Dán mã SVG (<svg ...>...</svg>) vào đây..." : "Paste SVG code here..."}
    />
  );
}
