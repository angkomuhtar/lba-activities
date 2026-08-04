export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatNumber(value: number | { toString(): string } | null | undefined): string {
  if (value === null || value === undefined) return "0";
  const n = typeof value === "number" ? value : Number(value.toString());
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);
}