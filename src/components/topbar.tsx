import Link from "next/link";

interface TopbarProps {
  title: string;
  username: string;
}

export default function Topbar({ title, username }: TopbarProps) {
  return (
    <header className="flex h-16 items-center border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{username}</span>
        <Link
          href="/users"
          className="inline-flex h-7 items-center gap-1 rounded-lg bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground hover:bg-primary/80"
        >
          Tambah User
        </Link>
      </div>
    </header>
  );
}