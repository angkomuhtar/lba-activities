"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  pageParam?: string;
}

function pageItems(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
  const items: (number | "...")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) items.push("...");
    items.push(p);
    prev = p;
  }
  return items;
}

function buildHref(pathname: string, searchParams: URLSearchParams, target: number, pageParam: string) {
  const params = new URLSearchParams(searchParams.toString());
  if (target <= 1) params.delete(pageParam);
  else params.set(pageParam, String(target));
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function Pagination({ page, totalPages, pageParam = "page" }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const items = pageItems(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
      <p className="text-sm text-muted-foreground">
        Halaman {page} dari {totalPages}
      </p>
      <nav className="flex items-center gap-1">
        <Link
          href={buildHref(pathname, searchParams, page - 1, pageParam)}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors",
            page <= 1
              ? "pointer-events-none opacity-50"
              : "hover:bg-muted hover:text-foreground",
          )}
        >
          <ChevronLeft className="size-4" />
        </Link>

        {items.map((item, idx) =>
          item === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <Link
              key={item}
              href={buildHref(pathname, searchParams, item, pageParam)}
              aria-current={item === page ? "page" : undefined}
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-lg border text-sm transition-colors",
                item === page
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item}
            </Link>
          ),
        )}

        <Link
          href={buildHref(pathname, searchParams, page + 1, pageParam)}
          aria-disabled={page >= totalPages}
          tabIndex={page >= totalPages ? -1 : undefined}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors",
            page >= totalPages
              ? "pointer-events-none opacity-50"
              : "hover:bg-muted hover:text-foreground",
          )}
        >
          <ChevronRight className="size-4" />
        </Link>
      </nav>
    </div>
  );
}
