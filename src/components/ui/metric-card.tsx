import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function MetricCard({
  title,
  value,
  suffix,
  icon: Icon,
  trend,
  trendLabel,
  variant = 'default',
  className,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return Minus;
    return trend > 0 ? TrendingUp : TrendingDown;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-muted-foreground';
    return trend > 0 ? 'text-emerald-400' : 'text-rose-400';
  };

  const TrendIcon = getTrendIcon();

  return (
    <div className={cn(
      "glass-card-hover p-4 md:p-5",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          variant === 'primary' && "bg-primary/10 text-primary",
          variant === 'success' && "bg-emerald-500/10 text-emerald-400",
          variant === 'warning' && "bg-amber-500/10 text-amber-400",
          variant === 'danger' && "bg-rose-500/10 text-rose-400",
          variant === 'default' && "bg-secondary text-foreground"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        
        {trend !== undefined && (
          <div className={cn("flex items-center gap-1 text-sm", getTrendColor())}>
            <TrendIcon className="h-4 w-4" />
            <span className="font-medium">
              {trend > 0 ? '+' : ''}{trend}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-display text-2xl font-bold text-foreground md:text-3xl">
            {value}
          </span>
          {suffix && (
            <span className="text-sm text-muted-foreground">{suffix}</span>
          )}
        </div>
        {trendLabel && (
          <p className="mt-1 text-xs text-muted-foreground">{trendLabel}</p>
        )}
      </div>
    </div>
  );
}
