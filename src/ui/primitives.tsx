"use client";

/**
 * Adapters over shadcn/ui primitives that preserve Atlas's existing component
 * API (variant names, `loading`, `invalid`) so feature components don't need to
 * change. The visual look is preserved via the Atlas→shadcn token mapping in
 * globals.css.
 */

import { forwardRef } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button as SButton } from "@/src/components/ui/button";
import { Input as SInput } from "@/src/components/ui/input";
import { Textarea as STextarea } from "@/src/components/ui/textarea";
import { Label as SLabel } from "@/src/components/ui/label";
import { Card as SCard } from "@/src/components/ui/card";
import { Badge as SBadge } from "@/src/components/ui/badge";
import type { ProductStatus, Role } from "@/src/lib/types";

// ── Button ────────────────────────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantMap = {
  primary: "default",
  secondary: "outline",
  ghost: "ghost",
  danger: "destructive",
} as const;
const sizeMap = { sm: "sm", md: "default", lg: "lg" } as const;

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
  }
>(function Button(
  { variant = "primary", size = "md", loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <SButton
      ref={ref}
      variant={variantMap[variant]}
      size={sizeMap[size]}
      disabled={disabled || loading}
      className={className}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </SButton>
  );
});

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      role="status"
      aria-label="Loading"
      className={cn("animate-spin", className ?? "h-4 w-4")}
    />
  );
}

// ── Input / Textarea / Label ─────────────────────────────────────────────────
export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ className, invalid, ...rest }, ref) {
  return (
    <SInput
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn("h-10 bg-surface", className)}
      {...rest}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, ...rest }, ref) {
  return (
    <STextarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn("bg-surface", className)}
      {...rest}
    />
  );
});

export function Label({ className, ...rest }: React.ComponentProps<typeof SLabel>) {
  return <SLabel className={cn("mb-1.5 text-[12.5px] text-text-2", className)} {...rest} />;
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs text-danger">{children}</p>;
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ className, ...rest }: React.ComponentProps<typeof SCard>) {
  // Reset shadcn Card's default vertical padding/gap so existing inner padding holds.
  return <SCard className={cn("gap-0 rounded-2xl py-0", className)} {...rest} />;
}

// ── Badges ────────────────────────────────────────────────────────────────────
const statusStyles: Record<ProductStatus, { cls: string; key: string }> = {
  PUBLISHED: { cls: "bg-success-soft text-success border-success-bd", key: "status_published" },
  DRAFT: { cls: "bg-warning-soft text-warning border-warning-bd", key: "status_draft" },
  OUT_OF_STOCK: { cls: "bg-danger-soft text-danger border-danger-bd", key: "status_out_of_stock" },
};

export function StatusBadge({ status, label }: { status: ProductStatus; label?: string }) {
  const t = useTranslations("common");
  const s = statusStyles[status];
  return (
    <SBadge variant="outline" className={cn("h-6 gap-1.5 rounded-full px-2.5", s.cls)}>
      <span className="h-1 w-1 rounded-full bg-current" />
      {label ?? t(s.key)}
    </SBadge>
  );
}

export function RoleBadge({ role, label }: { role: Role; label?: string }) {
  const t = useTranslations("common");
  const isAdmin = role === "ADMIN";
  return (
    <SBadge
      variant="outline"
      className={cn(
        "h-6 gap-1.5 rounded-full px-2.5",
        isAdmin
          ? "bg-accent-soft text-accent border-accent-line"
          : "bg-surface-3 text-text-2 border-border",
      )}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {label ?? (isAdmin ? t("role_admin") : t("role_user"))}
    </SBadge>
  );
}
