"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ImageIcon, Pencil, Trash2, TriangleAlert } from "lucide-react";
import { api } from "@/src/lib/api";
import { useErrorMessage } from "@/src/lib/useErrorMessage";
import { cn } from "@/src/lib/utils";
import type { Paginated, Product, ProductStatus } from "@/src/lib/types";
import { Button, Checkbox, Input, Label, StatusBadge } from "@/src/ui/primitives";
import { DataTable } from "@/src/ui/DataTable";
import { Pagination } from "@/src/ui/Pagination";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";

const STATUS_OPTIONS: ProductStatus[] = ["PUBLISHED", "DRAFT", "OUT_OF_STOCK"];
const STATUS_KEYS: Record<ProductStatus, string> = {
  PUBLISHED: "status_published",
  DRAFT: "status_draft",
  OUT_OF_STOCK: "status_out_of_stock",
};

/** Small product image with a graceful placeholder when none is set. */
function Thumb({ src, alt, size = 36 }: { src: string | null; alt: string; size?: number }) {
  if (!src) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-lg border border-border bg-surface-3 text-text-3"
        style={{ width: size, height: size }}
      >
        <ImageIcon className="h-4 w-4" />
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="shrink-0 rounded-lg border border-border object-cover"
      style={{ width: size, height: size }}
      unoptimized
    />
  );
}

type DraftProduct = {
  id?: string;
  name: string;
  priceDollars: string;
  category: string;
  status: ProductStatus;
  stock: string;
  description: string;
  imageUrl: string;
};

const emptyDraft: DraftProduct = {
  name: "",
  priceDollars: "",
  category: "",
  status: "DRAFT",
  stock: "0",
  description: "",
  imageUrl: "",
};

export function Management() {
  const t = useTranslations("management");
  const em = useErrorMessage();
  const format = useFormatter();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const sheetSide = isRtl ? "left" : "right";
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<DraftProduct | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const params = new URLSearchParams({ page: String(page), pageSize: "10" });
  if (q) params.set("q", q);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-products", { q, page }],
    queryFn: () => api<Paginated<Product>>(`/products?${params.toString()}`),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (d: DraftProduct) => {
      const body = {
        name: d.name,
        priceCents: Math.round(parseFloat(d.priceDollars || "0") * 100),
        category: d.category,
        status: d.status,
        stock: parseInt(d.stock || "0", 10),
        description: d.description,
        imageUrl: d.imageUrl.trim() || undefined,
      };
      if (d.id) return api(`/products/${d.id}`, { method: "PATCH", body });
      return api("/products", { method: "POST", body });
    },
    onSuccess: () => {
      setDraft(null);
      invalidate();
      toast.success(t("saveSuccess"));
    },
    onError: (e) => toast.error(em(e, t("saveError"))),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setToDelete(null);
      invalidate();
      toast.success(t("deleteSuccess"));
    },
    onError: (e) => toast.error(em(e, t("deleteError"))),
  });

  const bulkMutation = useMutation({
    mutationFn: (action: "publish" | "draft" | "delete") =>
      api("/products/bulk", { method: "POST", body: { action, ids: [...selected] } }),
    onSuccess: () => {
      setSelected(new Set());
      invalidate();
      toast.success(t("bulkSuccess"));
    },
    onError: (e) => toast.error(em(e, t("bulkError"))),
  });

  const syncMutation = useMutation({
    mutationFn: () => api("/products/sync", { method: "POST" }),
    onSuccess: () => {
      invalidate();
      toast.success(t("syncSuccess"));
    },
    onError: () => toast.error(t("syncError")),
  });

  const toggleSelect = useCallback(
    (id: string) =>
      setSelected((s) => {
        const n = new Set(s);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      }),
    [],
  );

  const toggleAllOnPage = useCallback((items: Product[], check: boolean) => {
    setSelected((s) => {
      const n = new Set(s);
      for (const it of items) {
        if (check) n.add(it.id);
        else n.delete(it.id);
      }
      return n;
    });
  }, []);

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        id: "select",
        meta: { thClass: "w-10 px-4", tdClass: "px-4" },
        header: () => {
          const items = data?.items ?? [];
          const all = items.length > 0 && items.every((p) => selected.has(p.id));
          const some = items.some((p) => selected.has(p.id));
          return (
            <Checkbox
              aria-label={t("selectAll")}
              checked={all}
              indeterminate={some && !all}
              onChange={(e) => toggleAllOnPage(items, e.target.checked)}
            />
          );
        },
        cell: ({ row }) => (
          <Checkbox
            checked={selected.has(row.original.id)}
            onChange={() => toggleSelect(row.original.id)}
            aria-label={t("selectRow", { name: row.original.name })}
          />
        ),
      },
      {
        id: "product",
        header: t("colProduct"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Thumb src={row.original.imageUrl} alt={row.original.name} />
            <div className="min-w-0">
              <div className="truncate font-medium text-text">{row.original.name}</div>
              <div className="font-mono text-[11px] text-text-3">{row.original.sku ?? "—"}</div>
            </div>
          </div>
        ),
      },
      {
        id: "price",
        header: t("colPrice"),
        meta: { tdClass: "font-medium text-text" },
        cell: ({ row }) =>
          format.number(row.original.priceCents / 100, {
            style: "currency",
            currency: row.original.currency,
          }),
      },
      {
        id: "category",
        header: t("colCategory"),
        meta: { thClass: "hidden sm:table-cell", tdClass: "hidden capitalize text-text-2 sm:table-cell" },
        cell: ({ row }) => row.original.category,
      },
      {
        id: "status",
        header: t("colStatus"),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: t("colActions"),
        meta: { thClass: "px-4 text-end", tdClass: "px-4 text-end" },
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() =>
                  setDraft({
                    id: p.id,
                    name: p.name,
                    priceDollars: (p.priceCents / 100).toString(),
                    category: p.category,
                    status: p.status,
                    stock: String(p.stock),
                    description: p.description,
                    imageUrl: p.imageUrl ?? "",
                  })
                }
                aria-label={t("edit")}
                title={t("edit")}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-strong text-text-2 hover:border-accent hover:text-accent"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setToDelete(p)}
                aria-label={t("delete")}
                title={t("delete")}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-strong text-text-2 hover:border-danger hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [t, format, selected, toggleSelect, toggleAllOnPage, data],
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-text">{t("title")}</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => syncMutation.mutate()} loading={syncMutation.isPending}>
            {t("syncFromApi")}
          </Button>
          <Button onClick={() => setDraft({ ...emptyDraft })}>
            + {t("addProduct")}
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="h-9 w-full max-w-xs rounded-lg border border-border-strong bg-surface px-3 text-sm text-text outline-none focus:border-accent"
        />
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-accent-line bg-accent-soft px-4 py-2.5">
          <span className="text-sm font-medium text-accent">{t("selected", { count: selected.size })}</span>
          <Button size="sm" variant="secondary" onClick={() => bulkMutation.mutate("publish")}>{t("publish")}</Button>
          <Button size="sm" variant="secondary" onClick={() => bulkMutation.mutate("draft")}>{t("draft")}</Button>
          <Button size="sm" variant="danger" onClick={() => bulkMutation.mutate("delete")}>{t("delete")}</Button>
          <button onClick={() => setSelected(new Set())} className="ms-auto text-sm text-accent">{t("clear")}</button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <span className="skeleton h-[18px] w-[18px] rounded-[5px]" />
                <span className="skeleton h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-2/5 rounded" />
                  <div className="skeleton h-2.5 w-1/4 rounded" />
                </div>
                <span className="skeleton h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-10 text-center text-sm text-text-2">{t("fetchError")}</div>
        ) : data && data.items.length > 0 ? (
          <DataTable table={table} label={t("title")} />
        ) : (
          <div className="p-10 text-center">
            <h2 className="text-base font-semibold text-text">{t("emptyTitle")}</h2>
            <p className="mt-1 text-sm text-text-2">{t("emptyBody")}</p>
          </div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-text-2">
            {t("pageInfo", { page: data.page, totalPages: data.totalPages, total: data.total })}
          </span>
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </div>
      )}

      {/* Edit/create drawer */}
      <Sheet open={!!draft} onOpenChange={(open) => { if (!open) setDraft(null); }}>
        <SheetContent side={sheetSide} className="w-full overflow-y-auto p-0 sm:max-w-md">
          {draft && (
            <>
              <SheetHeader className="border-b border-border">
                <SheetTitle className="text-base text-text">{draft.id ? t("editTitle") : t("addTitle")}</SheetTitle>
              </SheetHeader>
              <form
                className="space-y-4 p-5"
                onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(draft); }}
              >
                <div>
                  <Label>{t("fieldImage")}</Label>
                  <div className="flex items-center gap-3">
                    <Thumb src={draft.imageUrl.trim() || null} alt={draft.name} size={48} />
                    <Input
                      value={draft.imageUrl}
                      onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
                      placeholder={t("imageHint")}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>{t("fieldName")}</Label>
                  <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t("fieldPrice")}</Label>
                    <Input type="number" step="0.01" min="0" value={draft.priceDollars} onChange={(e) => setDraft({ ...draft, priceDollars: e.target.value })} required />
                  </div>
                  <div>
                    <Label>{t("fieldStock")}</Label>
                    <Input type="number" min="0" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>{t("fieldCategory")}</Label>
                  <Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} required />
                </div>
                <div>
                  <Label>{t("fieldStatus")}</Label>
                  <div className="flex gap-1 rounded-lg border border-border-strong p-1">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setDraft({ ...draft, status: s })}
                        aria-pressed={draft.status === s}
                        className={cn(
                          "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                          draft.status === s
                            ? "bg-accent text-on-accent"
                            : "text-text-2 hover:bg-surface-2 hover:text-text",
                        )}
                      >
                        {t(STATUS_KEYS[s])}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>{t("fieldDescription")}</Label>
                  <textarea
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    className="h-24 w-full resize-none rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" loading={saveMutation.isPending}>{t("save")}</Button>
                  <Button type="button" variant="secondary" onClick={() => setDraft(null)}>{t("cancel")}</Button>
                </div>
              </form>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete dialog */}
      <Dialog open={!!toDelete} onOpenChange={(open) => { if (!open) setToDelete(null); }}>
        <DialogContent className="sm:max-w-sm">
          {toDelete && (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-danger-bd bg-danger-soft text-danger">
                <TriangleAlert className="h-6 w-6" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-center">{t("deleteTitle", { name: toDelete.name })}</DialogTitle>
              </DialogHeader>
              <p className="text-center text-sm text-text-2">{t("deleteBody")}</p>
              <DialogFooter>
                <Button variant="secondary" className="flex-1" onClick={() => setToDelete(null)}>{t("cancel")}</Button>
                <Button variant="danger" className="flex-1" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(toDelete.id)}>{t("delete")}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
