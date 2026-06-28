"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/src/lib/api";
import { useErrorMessage } from "@/src/lib/useErrorMessage";
import { useAuth } from "@/src/lib/auth";
import type { Paginated, Role, UserProfile } from "@/src/lib/types";
import { Button, Input, Label, RoleBadge, Spinner } from "@/src/ui/primitives";
import { DataTable } from "@/src/ui/DataTable";
import { Pagination } from "@/src/ui/Pagination";
import {
  Dialog,
  DialogContent,
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

function primaryEmail(u: UserProfile): string {
  return (u.emails.find((e) => e.isPrimary) ?? u.emails[0])?.address ?? "—";
}
function primaryPhone(u: UserProfile): string {
  const p = u.phones.find((x) => x.isPrimary) ?? u.phones[0];
  return p ? `${p.countryCode} ${p.number}` : "—";
}

export function UsersAdmin() {
  const t = useTranslations("users");
  const format = useFormatter();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<UserProfile | null>(null);

  const params = new URLSearchParams({ page: String(page), pageSize: "10" });
  if (q) params.set("q", q);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-users", { q, page }],
    queryFn: () => api<Paginated<UserProfile>>(`/users?${params.toString()}`),
    placeholderData: keepPreviousData,
  });

  const columns = useMemo<ColumnDef<UserProfile>[]>(
    () => [
      {
        id: "user",
        header: t("colUser"),
        meta: { thClass: "px-4", tdClass: "px-4" },
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center gap-3">
              <span
                className="h-8 w-8 flex-none rounded-full bg-gradient-to-br from-accent to-[#60a5fa] bg-cover"
                style={u.avatarUrl ? { backgroundImage: `url(${u.avatarUrl})` } : undefined}
              />
              <div className="min-w-0">
                <div className="font-medium text-text">
                  {u.firstName} {u.lastName}
                </div>
                <div className="truncate text-[12px] text-text-3">{primaryEmail(u)}</div>
              </div>
            </div>
          );
        },
      },
      {
        id: "role",
        header: t("colRole"),
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
      },
      {
        id: "phone",
        header: t("colPhone"),
        meta: { thClass: "hidden sm:table-cell", tdClass: "hidden text-text-2 sm:table-cell" },
        cell: ({ row }) => primaryPhone(row.original),
      },
      {
        id: "country",
        header: t("colCountry"),
        meta: { thClass: "hidden md:table-cell", tdClass: "hidden text-text-2 md:table-cell" },
        cell: ({ row }) => row.original.country ?? "—",
      },
      {
        id: "joined",
        header: t("colJoined"),
        meta: { thClass: "text-end", tdClass: "text-end font-mono text-[12px] text-text-3" },
        cell: ({ row }) => format.dateTime(new Date(row.original.createdAt), { dateStyle: "medium" }),
      },
      {
        id: "edit",
        header: t("colEdit"),
        meta: { thClass: "px-4 text-end", tdClass: "px-4 text-end" },
        cell: ({ row }) => (
          <button
            onClick={() => setEditing(row.original)}
            className="text-[13px] font-medium text-accent hover:underline"
          >
            {t("colEdit")}
          </button>
        ),
      },
    ],
    [t, format],
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-text">{t("title")}</h1>
      <p className="mb-5 text-sm text-text-2">
        {data ? t("subtitle", { total: data.total }) : t("subtitleEmpty")}
      </p>

      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="h-9 w-full max-w-xs rounded-lg border border-border-strong bg-surface px-3 text-sm text-text outline-none focus:border-accent"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner className="h-5 w-5 text-accent" />
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
            {t("pageInfo", { page: data.page, totalPages: data.totalPages })}
          </span>
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </div>
      )}

      {editing && <EditUserDialog user={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditUserDialog({ user, onClose }: { user: UserProfile; onClose: () => void }) {
  const t = useTranslations("users");
  const em = useErrorMessage();
  const queryClient = useQueryClient();
  const { user: me } = useAuth();
  const isSelf = me?.id === user.id;

  const [role, setRole] = useState<Role>(user.role);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [country, setCountry] = useState(user.country ?? "");

  const mutation = useMutation({
    mutationFn: () =>
      api<{ user: UserProfile }>(`/users/${user.id}`, {
        method: "PATCH",
        body: { role, firstName, lastName, country: country || null },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("updateSuccess"));
      onClose();
    },
    onError: (e) => toast.error(em(e, t("updateError"))),
  });

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("editTitle", { name: `${user.firstName} ${user.lastName}` })}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName">{t("firstName")}</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="lastName">{t("lastName")}</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>
          <div>
            <Label htmlFor="country">{t("country")}</Label>
            <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="role">{t("role")}</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)} disabled={isSelf}>
              <SelectTrigger id="role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">{t("role_user")}</SelectItem>
                <SelectItem value="ADMIN">{t("role_admin")}</SelectItem>
              </SelectContent>
            </Select>
            {isSelf && (
              <p className="mt-1.5 text-xs text-text-3">{t("cannotChangeSelf")}</p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" loading={mutation.isPending}>
              {t("save")}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
