"use client";

import Image from "next/image";
import { useFormatter } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import type { Product } from "@/src/lib/types";
import { StatusBadge } from "@/src/ui/primitives";

// Deterministic gradient placeholder when a product has no image.
function gradientFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 55%), hsl(${(h + 40) % 360} 70% 60%))`;
}

export function ProductCard({ product }: { product: Product }) {
  const format = useFormatter();
  const price = format.number(product.priceCents / 100, {
    style: "currency",
    currency: product.currency,
  });
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative h-32 w-full" style={{ background: gradientFor(product.slug) }}>
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover"
          />
        )}
        <span className="absolute end-2.5 top-2.5">
          <StatusBadge status={product.status} />
        </span>
      </div>
      <div className="p-3.5">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-wide text-text-3">
          {product.category}
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-text">{product.name}</span>
          <span className="text-sm font-semibold text-accent">{price}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-text-2">
          {product.description}
        </p>
      </div>
    </Link>
  );
}
