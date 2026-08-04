import { LayoutDashboard } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <span className="inline-flex items-center gap-2 text-lg font-semibold">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LayoutDashboard className="size-5" />
            </span>
            Dashboard
          </span>
        </div>
        <div className="rounded-xl border bg-background p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}