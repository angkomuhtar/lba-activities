"use client";

import { useSearchParams } from "next/navigation";

export function usePage(pageParam = "page"): number {
  const searchParams = useSearchParams();
  const raw = Number(searchParams.get(pageParam));
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize = 10,
): { rows: T[]; page: number; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safe = Math.min(page, totalPages);
  return {
    rows: items.slice((safe - 1) * pageSize, safe * pageSize),
    page: safe,
    totalPages,
  };
}