"use client";

import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/src/lib/api";
import { useErrorMessage } from "@/src/lib/useErrorMessage";
import type { Paginated, Product, ProductStatus } from "@/src/lib/types";
import { Button, Input, Label, StatusBadge, Spinner } from "@/src/ui/primitives";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

type DraftProduct = {
  id?: string;
  name: string;
  priceDollars: string;
  category: string;
  status: ProductStatus;
  stock: string;
  description: string;
};

const emptyDraft: DraftProduct = {
  name: "",
  priceDollars: "",
  category: "",
  status: "DRAFT",
  stock: "0",
  description: "",
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

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
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
          <div className="flex h-48 items-center justify-center"><Spinner className="h-5 w-5 text-accent" /></div>
        ) : isError ? (
          <div className="p-10 text-center text-sm text-text-2">{t("fetchError")}</div>
        ) : data && data.items.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-start text-[11px] uppercase tracking-wide text-text-2">
                <th className="w-10 px-4 py-2.5" />
                <th className="px-2 py-2.5 font-semibold">{t("colProduct")}</th>
                <th className="px-2 py-2.5 font-semibold">{t("colPrice")}</th>
                <th className="hidden px-2 py-2.5 font-semibold sm:table-cell">{t("colCategory")}</th>
                <th className="px-2 py-2.5 font-semibold">{t("colStatus")}</th>
                <th className="px-4 py-2.5 text-end font-semibold">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      aria-label={t("selectRow", { name: p.name })}
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div className="font-medium text-text">{p.name}</div>
                    <div className="font-mono text-[11px] text-text-3">{p.sku ?? "—"}</div>
                  </td>
                  <td className="px-2 py-3 font-medium text-text">
                    {format.number(p.priceCents / 100, { style: "currency", currency: p.currency })}
                  </td>
                  <td className="hidden px-2 py-3 capitalize text-text-2 sm:table-cell">{p.category}</td>
                  <td className="px-2 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-end">
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
                        })
                      }
                      className="me-3 text-accent hover:underline"
                    >
                      {t("edit")}
                    </button>
                    <button onClick={() => setToDelete(p)} className="text-danger hover:underline">
                      {t("delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-8 rounded-lg border border-border-strong bg-surface px-3 text-sm disabled:opacity-40">{isRtl ? "›" : "‹"}</button>
            <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="h-8 rounded-lg border border-border-strong bg-surface px-3 text-sm disabled:opacity-40">{isRtl ? "‹" : "›"}</button>
          </div>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t("fieldCategory")}</Label>
                    <Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} required />
                  </div>
                  <div>
                    <Label>{t("fieldStatus")}</Label>
                    <Select
                      value={draft.status}
                      onValueChange={(v) => setDraft({ ...draft, status: v as ProductStatus })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLISHED">{t("status_published")}</SelectItem>
                        <SelectItem value="DRAFT">{t("status_draft")}</SelectItem>
                        <SelectItem value="OUT_OF_STOCK">{t("status_out_of_stock")}</SelectItem>
                      </SelectContent>
                    </Select>
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
              <DialogHeader>
                <DialogTitle>{t("deleteTitle", { name: toDelete.name })}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-text-2">{t("deleteBody")}</p>
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
