"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NavSubmenuProps {
  icon: ReactNode;
  label: string;
  items: { href: string; label: string }[];
}

export function NavSubmenu({ icon, label, items }: NavSubmenuProps) {
  const pathname = usePathname();
  const active = items.some(
    (c) => pathname === c.href || pathname.startsWith(`${c.href}/`),
  );
  const [open, setOpen] = useState(active);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
      >
        {icon}
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            open ? "rotate-180" : "",
          )}
        />
      </button>

      {open && (
        <div className="mt-1 space-y-1 border-l pl-4 ml-5">
          {items.map((c) => {
            const isActive =
              pathname === c.href || pathname.startsWith(`${c.href}/`);
            return (
              <Link
                key={c.href}
                href={c.href}
                className={cn(
                  "block rounded-lg px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
