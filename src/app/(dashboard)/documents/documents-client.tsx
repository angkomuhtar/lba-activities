"use client";

import { useActionState, useState, useTransition } from "react";
import { AlertTriangle, Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createDocument,
  deleteDocument,
  updateDocument,
  type ActionResult,
} from "@/app/actions/documents";
import { formatDate } from "@/lib/format";
import { paginate, usePage } from "@/lib/use-pagination";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface DocumentItem {
  id: string;
  nama: string;
  nomor: string;
  tglTerbit: string | null;
  tglExpire: string | null;
  catatan: string | null;
}

interface DocumentsClientProps {
  documents: DocumentItem[];
  canManage: boolean;
}

const EXPIRY_WARNING_DAYS = 30;

export function DocumentsClient({ documents, canManage }: DocumentsClientProps) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    (prev, formData) => createDocument(prev, formData),
    undefined,
  );

  const daysUntil = (tglExpire: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(`${tglExpire}T00:00:00`);
    return Math.ceil((target.getTime() - today.getTime()) / 86400000);
  };

  const expiresSoon = (doc: DocumentItem): boolean => {
    if (!doc.tglExpire) return false;
    const days = daysUntil(doc.tglExpire);
    return days >= 0 && days <= EXPIRY_WARNING_DAYS;
  };

  const page = usePage();
  const { rows, page: safePage, totalPages } = paginate(documents, page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Manajemen Dokumen</h1>
        <p className="text-sm text-muted-foreground">
          Kelola dokumen: nama, nomor, tanggal terbit, dan tanggal kedaluwarsa (opsional).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {canManage ? (
            <form action={formAction} className="space-y-4 rounded-xl border bg-background p-4">
              <div className="flex items-center gap-2">
                <Plus className="size-4" />
                <h3 className="font-semibold">Tambah Dokumen</h3>
              </div>

              {state?.error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {state.error}
                </p>
              )}
              {state?.success && (
                <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
                  {state.success}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="nama">Nama Dokumen</Label>
                <Input id="nama" name="nama" placeholder="Contoh: Surat Persetujuan Berlayar" required disabled={pending} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomor">Nomor Dokumen</Label>
                <Input id="nomor" name="nomor" placeholder="Contoh: SPB-2026/001" required disabled={pending} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="tglTerbit">Tanggal Terbit</Label>
                  <Input id="tglTerbit" name="tglTerbit" type="date" disabled={pending} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tglExpire">Tanggal Kedaluwarsa</Label>
                  <Input id="tglExpire" name="tglExpire" type="date" disabled={pending} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Tanggal kedaluwarsa opsional.</p>

              <div className="space-y-2">
                <Label htmlFor="catatan">Catatan</Label>
                <Input id="catatan" name="catatan" placeholder="Catatan opsional" disabled={pending} />
              </div>

              <Button type="submit" className="w-full" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Simpan Dokumen
              </Button>
            </form>
          ) : (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              Anda tidak memiliki izin untuk mengelola dokumen.
            </p>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-background">
            <div className="border-b px-4 py-3">
              <h2 className="font-semibold">Daftar Dokumen</h2>
            </div>

            {documents.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Belum ada dokumen.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dokumen</TableHead>
                      <TableHead>No.</TableHead>
                      <TableHead>Terbit</TableHead>
                      <TableHead>Kedaluwarsa</TableHead>
                      {canManage && <TableHead className="text-right">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((doc) => {
                      const soon = expiresSoon(doc);
                      return (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="font-medium">{doc.nama}</p>
                              {doc.catatan && (
                                <p className="text-xs text-muted-foreground">{doc.catatan}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{doc.nomor}</TableCell>
                          <TableCell className="text-sm">
                            {doc.tglTerbit ? formatDate(doc.tglTerbit) : "-"}
                          </TableCell>
                          <TableCell>
                            {doc.tglExpire ? (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                  soon
                                    ? "bg-amber-400/15 text-amber-600"
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                {soon && <AlertTriangle className="size-3" />}
                                {formatDate(doc.tglExpire)}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          {canManage && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <EditDocumentButton doc={doc} />
                                <DeleteDocumentButton id={doc.id} />
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            {documents.length > 0 && <Pagination page={safePage} totalPages={totalPages} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditDocumentButton({ doc }: { doc: DocumentItem }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="icon-sm" title="Edit" onClick={() => setOpen(true)}>
        <Pencil className="size-4" />
      </Button>
    );
  }

  return <EditDocumentForm doc={doc} onCancel={() => setOpen(false)} />;
}

function EditDocumentForm({ doc, onCancel }: { doc: DocumentItem; onCancel: () => void }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    (prev, formData) => updateDocument(doc.id, prev, formData),
    undefined,
  );

  return (
    <form action={formAction} className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Edit Dokumen</h3>
        <Button type="button" variant="ghost" size="icon-sm" title="Batal" onClick={onCancel} disabled={pending}>
          <X className="size-4" />
        </Button>
      </div>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">{state.success}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor={`nama-${doc.id}`}>Nama Dokumen</Label>
        <Input id={`nama-${doc.id}`} name="nama" defaultValue={doc.nama} required disabled={pending} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`nomor-${doc.id}`}>Nomor Dokumen</Label>
        <Input id={`nomor-${doc.id}`} name="nomor" defaultValue={doc.nomor} required disabled={pending} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`tglTerbit-${doc.id}`}>Tanggal Terbit</Label>
          <Input id={`tglTerbit-${doc.id}`} name="tglTerbit" type="date" defaultValue={doc.tglTerbit ?? ""} disabled={pending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`tglExpire-${doc.id}`}>Tanggal Kedaluwarsa</Label>
          <Input id={`tglExpire-${doc.id}`} name="tglExpire" type="date" defaultValue={doc.tglExpire ?? ""} disabled={pending} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`catatan-${doc.id}`}>Catatan</Label>
        <Input id={`catatan-${doc.id}`} name="catatan" defaultValue={doc.catatan ?? ""} disabled={pending} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Simpan
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Batal
        </Button>
      </div>
    </form>
  );
}

function DeleteDocumentButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title="Hapus dokumen"
      disabled={pending}
      onClick={() => {
        if (!confirm("Hapus dokumen ini?")) return;
        startTransition(async () => {
          await deleteDocument(id);
        });
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </Button>
  );
}
