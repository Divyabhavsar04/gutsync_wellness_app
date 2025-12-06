import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { DesktopNav } from './DesktopNav';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      
      <main className="pb-24 md:ml-64 md:pb-8">
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
          {children}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
