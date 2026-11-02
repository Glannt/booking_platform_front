"use client";

import React from "react";
import { Button, Tooltip } from "@heroui/react";
import { Eye, Edit3, Trash2 } from "lucide-react";

interface RowActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  className?: string;
}

export function RowActionButtons({
  onView,
  onEdit,
  onDelete,
  viewLabel = "Xem chi tiết",
  editLabel = "Chỉnh sửa",
  deleteLabel = "Xóa",
  className = "",
}: RowActionButtonsProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {onView && (
        <Tooltip delay={300} closeDelay={100}>
          <Tooltip.Trigger>
            <Button
              isIconOnly
              size="sm"
              variant="tertiary"
              aria-label={viewLabel}
              onPress={onView}
            >
              <Eye size={16} />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <Tooltip.Arrow />
            {viewLabel}
          </Tooltip.Content>
        </Tooltip>
      )}
      {onEdit && (
        <Tooltip delay={300} closeDelay={100}>
          <Tooltip.Trigger>
            <Button
              isIconOnly
              size="sm"
              variant="secondary"
              aria-label={editLabel}
              onPress={onEdit}
            >
              <Edit3 size={16} />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <Tooltip.Arrow />
            {editLabel}
          </Tooltip.Content>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip delay={300} closeDelay={100}>
          <Tooltip.Trigger>
            <Button
              isIconOnly
              size="sm"
              variant="danger"
              aria-label={deleteLabel}
              onPress={onDelete}
            >
              <Trash2 size={16} />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content className="text-rose-600 dark:text-rose-400">
            <Tooltip.Arrow />
            {deleteLabel}
          </Tooltip.Content>
        </Tooltip>
      )}
    </div>
  );
}

export default RowActionButtons;