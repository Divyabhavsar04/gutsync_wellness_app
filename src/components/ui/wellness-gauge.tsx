import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react';

interface WellnessGaugeProps {
  score: number;
  category?: string;
  subtitle?: string;
  className?: string;
}

export function WellnessGauge({ score, category, subtitle, className }: WellnessGaugeProps) {
  const getColor = () => {
    if (score >= 75) return 'from-emerald-400 to-teal-500';
    if (score >= 50) return 'from-amber-400 to-orange-500';
    if (score >= 25) return 'from-orange-400 to-rose-500';
    return 'from-rose-400 to-red-600';
  };

  const getMessage = () => {
    if (score >= 75) return 'Your biology is well-balanced today';
    if (score >= 50) return 'Room for improvement today';
    if (score >= 25) return 'Take it easy and focus on recovery';
    return 'Consider speaking with a healthcare provider';
  };

  return (
    <div className={cn("glass-card p-5 md:p-6", className)}>
      <div className="flex items-start gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center">
            <div className="flex gap-[2px]">
              <div className="h-4 w-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="h-6 w-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="h-5 w-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {"Today's Sync Status"}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold text-foreground md:text-5xl">
              {score}
            </span>
            <span className="text-lg text-muted-foreground">/ 100</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {subtitle || getMessage()}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
        <div 
          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000", getColor())}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function WellnessScoreBar({ score, label, className }: { score: number; label: string; className?: string }) {
  const getColor = () => {
    if (score >= 75) return 'from-emerald-400 to-teal-500';
    if (score >= 50) return 'from-amber-400 to-orange-500';
    if (score >= 25) return 'from-orange-400 to-rose-500';
    return 'from-rose-400 to-red-600';
  };

  return (
    <div className={cn("glass-card p-4", className)}>
      <div className="flex items-center gap-3">
        <Heart className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Wellness Score</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <span className="font-display text-2xl font-bold text-primary">
              {score}<span className="text-sm text-muted-foreground">/100</span>
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div 
              className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000", getColor())}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
