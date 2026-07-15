"use client";

import React, { useState, useMemo, UIEvent } from "react";
import { Autocomplete, EmptyState, ListBox, SearchField, Label, useFilter } from "@heroui/react";
import { TOUR_ICONS } from "@/lib/utils/icons";

interface TourOptionIconPickerProps {
  value: string;
  onChange: (value: string) => void;
  colorIcon?: string;
  language: string;
}

export function TourOptionIconPicker({
  value,
  onChange,
  colorIcon,
  language
}: TourOptionIconPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);
  const { contains } = useFilter({ sensitivity: "base" });

  const filteredIcons = useMemo(() => {
    if (!searchQuery) return TOUR_ICONS;
    return TOUR_ICONS.filter((item) => contains(item.name, searchQuery));
  }, [searchQuery, contains]);

  const visibleIcons = useMemo(() => {
    return filteredIcons.slice(0, visibleCount);
  }, [filteredIcons, visibleCount]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 40) {
      if (visibleCount < filteredIcons.length) {
        setVisibleCount((prev) => Math.min(prev + 20, filteredIcons.length));
      }
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setVisibleCount(20);
  };

  return (
    <Autocomplete
      className="w-full"
      placeholder={language === "vi" ? "Chọn Icon..." : "Select Icon..."}
      selectionMode="single"
      value={value || null}
      onChange={(key) => onChange(key ? String(key) : "")}
    >
      <Autocomplete.Trigger>
        <Autocomplete.Value>
          {({ defaultChildren, isPlaceholder, state }) => {
            if (isPlaceholder || state.selectedItems.length === 0) {
              return defaultChildren;
            }

            const selectedKey = state.selectedItems[0]?.key;
            const selectedItem = TOUR_ICONS.find((item) => item.name === selectedKey);

            if (!selectedItem) {
              return defaultChildren;
            }

            const IconComponent = selectedItem.IconComponent;

            return (
              <div className="flex items-center gap-2 max-w-full">
                <IconComponent size={14} style={{ color: colorIcon || undefined }} />
                <span className="text-xs font-bold whitespace-normal break-all leading-normal max-w-full">
                  {selectedItem.name}
                </span>
              </div>
            );
          }}
        </Autocomplete.Value>
        <Autocomplete.ClearButton />
        <Autocomplete.Indicator />
      </Autocomplete.Trigger>
      <Autocomplete.Popover>
        <Autocomplete.Filter filter={() => true}>
          <SearchField
            autoFocus
            name="search"
            variant="secondary"
            value={searchQuery}
            onChange={handleSearchChange}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder={language === "vi" ? "Tìm icon..." : "Search icons..."} />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <ListBox
            onScroll={handleScroll}
            className="max-h-[300px] overflow-y-auto"
            renderEmptyState={() => <EmptyState>{language === "vi" ? "Không tìm thấy kết quả" : "No results found"}</EmptyState>}
          >
            {visibleIcons.map((item) => {
              const IconComponent = item.IconComponent;
              return (
                <ListBox.Item key={item.name} id={item.name} textValue={item.name}>
                  <div className="flex items-center gap-2 max-w-full py-0.5">
                    <IconComponent size={16} style={{ color: colorIcon || undefined }} />
                    <Label className="text-xs font-bold cursor-pointer whitespace-normal break-all leading-normal max-w-full">
                      {item.name}
                    </Label>
                  </div>
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              );
            })}
          </ListBox>
        </Autocomplete.Filter>
      </Autocomplete.Popover>
    </Autocomplete>
  );
}
