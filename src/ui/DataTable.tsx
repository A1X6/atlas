"use client";

import { flexRender, type Table as TanstackTable, type RowData } from "@tanstack/react-table";
import { cn } from "@/src/lib/utils";

/**
 * Shared headless table renderer built on TanStack Table. Feature components
 * define columns + a `useReactTable` instance and hand it here; this owns only
 * the Atlas table markup/styling. Per-column responsive classes go through the
 * column `meta` (thClass / tdClass).
 */
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    thClass?: string;
    tdClass?: string;
  }
}

export function DataTable<T>({ table, label }: { table: TanstackTable<T>; label?: string }) {
  return (
    <table className="w-full text-sm" aria-label={label}>
      <thead>
        {table.getHeaderGroups().map((hg) => (
          <tr
            key={hg.id}
            className="border-b border-border bg-surface-2 text-start text-[11px] uppercase tracking-wide text-text-2"
          >
            {hg.headers.map((h) => (
              <th
                key={h.id}
                className={cn("px-2 py-2.5 font-semibold", h.column.columnDef.meta?.thClass)}
              >
                {h.isPlaceholder
                  ? null
                  : flexRender(h.column.columnDef.header, h.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            className="border-b border-border last:border-0 hover:bg-surface-2"
          >
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className={cn("px-2 py-3", cell.column.columnDef.meta?.tdClass)}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
