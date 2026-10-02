"use client";

import { Label } from "@/components/ui/label";

export interface JettyOption {
  id: string;
  nama: string;
  location: string | null;
  type: "LOADING" | "DISCHARGING" | null;
}

interface JettyRouteSelectProps {
  id: string;
  name: "ruteAsal" | "ruteTujuan";
  label: string;
  jetties: JettyOption[];
  defaultValue?: string | null;
  defaultValueId?: string | null;
  disabled?: boolean;
}

function jettyLabel(j: JettyOption): string {
  return j.location ? `${j.nama} (${j.location})` : j.nama;
}

export function JettyRouteSelect({
  id,
  name,
  label,
  jetties,
  defaultValue,
  defaultValueId,
  disabled,
}: JettyRouteSelectProps) {
  const hasLegacy = Boolean(defaultValue);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        name={`${name}Id`}
        defaultValue={defaultValueId ?? ""}
        disabled={disabled}
        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
      >
        <option value="">{hasLegacy ? `Teks lama: ${defaultValue}` : "Pilih jetty…"}</option>
        <optgroup label="Loading">
          {jetties
            .filter((j) => j.type === "LOADING")
            .sort((a, b) => a.nama.localeCompare(b.nama))
            .map((j) => (
              <option key={j.id} value={j.id}>
                {jettyLabel(j)}
              </option>
            ))}
        </optgroup>
        <optgroup label="Discharging">
          {jetties
            .filter((j) => j.type === "DISCHARGING")
            .sort((a, b) => a.nama.localeCompare(b.nama))
            .map((j) => (
              <option key={j.id} value={j.id}>
                {jettyLabel(j)}
              </option>
            ))}
        </optgroup>
      </select>
      <input type="hidden" name={name} value={defaultValue ?? ""} />
    </div>
  );
}