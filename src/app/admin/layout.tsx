import type { ReactNode } from 'react';
import { CommandPalette } from '@/app/_container/CommandPalette';
import { AdminAccessBanner } from '@features/admin/components/AdminAccessBanner';
import { AdminNavigationProvider } from '@features/admin/components/AdminNavigationProvider';
import { AdminShell } from '@features/admin/components/AdminShell';
import { getOwnerAccess } from '@lib/auth/owner';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const access = await getOwnerAccess();
  return (
    <AdminShell
      authorized={access.authorized}
      banner={<AdminAccessBanner access={access} />}
      search={<CommandPalette />}
      userEmail={access.email ?? undefined}
    >
      {access.authorized ? <AdminNavigationProvider>{children}</AdminNavigationProvider> : null}
    </AdminShell>
  );
}
