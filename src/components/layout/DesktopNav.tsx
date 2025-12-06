import { Home, Plus, BarChart3, Settings } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'log', label: 'Log', icon: Plus },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function DesktopNav() {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-full w-64 border-r border-border bg-card/50 backdrop-blur-xl md:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center px-6">
          <h1 className="font-display text-2xl font-bold gradient-text">
            GUTSYNC
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-4 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-300",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  isActive && "scale-110",
                  !isActive && "group-hover:scale-110"
                )} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground">
              Sync your wellness journey
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: '75%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
