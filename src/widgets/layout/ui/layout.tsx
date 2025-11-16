import { type ReactNode } from 'react';

import { ScrollProgressBar } from '@src/shared/ui/scroll-progress-bar';

import { Footer } from './footer';
import { Header } from './header';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => (
  <div className="flex min-h-screen flex-col">
    <ScrollProgressBar />
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);
