import type { ReactNode } from 'react';
import { AdminNavigationProvider } from '@features/admin/components/AdminNavigationProvider';

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminNavigationProvider>{children}</AdminNavigationProvider>;
}
