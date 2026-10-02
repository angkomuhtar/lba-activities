export function jettyLabel(j: { nama: string; location: string | null } | null | undefined): string | null {
  if (!j) return null;
  return [j.nama, j.location].filter(Boolean).join(", ");
}

export function ruteLabel(
  asal: { nama: string; location: string | null } | null | undefined,
  tujuan: { nama: string; location: string | null } | null | undefined,
  fallback?: string | null,
): string {
  if (asal || tujuan) {
    return `${jettyLabel(asal) ?? "?"} → ${jettyLabel(tujuan) ?? "?"}`;
  }
  return fallback ?? "Pelayaran";
}