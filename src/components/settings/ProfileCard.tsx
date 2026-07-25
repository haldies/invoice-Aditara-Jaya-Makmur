import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';

// Simple Avatar showing initials when no image is available
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
      {initials}
    </div>
  );
}

export function ProfileCard() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <section className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <Avatar name={user?.email ?? 'U'} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Akun Terhubung
        </p>
        <p className="mt-1 truncate text-lg font-semibold text-foreground">
          {user?.email}
        </p>
      </div>
      <Button
        size="icon"
        variant="outline"
        className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
        title="Keluar"
        aria-label="Keluar"
        onClick={async () => {
          await signOut();
          await router.replace('/login');
        }}
      >
        <LogOut className="h-5 w-5" />
      </Button>
    </section>
  );
}
