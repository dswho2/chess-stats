"use client";

/**
 * DataTable Component
 * Reusable table for displaying tournament standings, results, etc.
 * Features: Sortable columns, responsive, sticky header
 */

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  className,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;

    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue === bValue) return 0;

    const comparison = aValue > bValue ? 1 : -1;
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const alignmentClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-[#1a1f24] z-10">
          <tr className="border-b border-[#2d3339]">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-4 py-3 text-xs font-semibold uppercase tracking-wider",
                  "text-[#9ca3af]",
                  alignmentClasses[column.align || "left"],
                  column.sortable && "cursor-pointer hover:text-[#e8e8e8] select-none",
                  column.width
                )}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-1 justify-start">
                  {column.label}
                  {column.sortable && sortColumn === column.key && (
                    <span className="text-[#3b82f6]">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-[#6b7280]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, index) => (
              <tr
                key={keyExtractor(row)}
                className={cn(
                  "border-b border-[#2d3339] transition-colors",
                  index % 2 === 0 ? "bg-[#1a1f24]" : "bg-[#151a1f]",
                  onRowClick && "cursor-pointer hover:bg-[#1f2429]"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-sm",
                      alignmentClasses[column.align || "left"],
                      "text-[#e8e8e8]"
                    )}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
