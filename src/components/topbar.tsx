import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopbarProps {
  title: string;
  username: string;
}

export default function Topbar({ title, username }: TopbarProps) {
  const initials = username
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  return (
    <header className='flex h-16 items-center border-b bg-card px-4 md:px-6'>
      <div className='flex items-center gap-3'>
        <h1 className='text-lg font-semibold'>{title}</h1>
      </div>
      <div className='ml-auto flex items-center gap-2'>
        <span className='text-sm'>{username}</span>
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
