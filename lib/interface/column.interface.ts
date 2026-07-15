import type { ReactNode } from "react";

export type ColumnInterface = {
    id: string;
    label: string;
    sortable: boolean;
    isRowHeader?: boolean;
};