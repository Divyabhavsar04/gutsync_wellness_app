import { LineChart, Line, XAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TrendChartProps {
  data: any[];
  dataKey: string;
  title: string;
  color?: string;
  trend?: number;
  className?: string;
}

export function TrendChart({ data, dataKey, title, color = 'hsl(var(--primary))', trend, className }: TrendChartProps) {
  const trendColor = trend && trend > 0 ? 'text-emerald-400' : trend && trend < 0 ? 'text-rose-400' : 'text-muted-foreground';
  const TrendIcon = trend && trend > 0 ? TrendingUp : TrendingDown;

  return (
    <div className={cn("glass-card p-4", className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-medium text-foreground">{title}</span>
        </div>
        {trend !== undefined && (
          <div className={cn("flex items-center gap-1 text-sm", trendColor)}>
            <TrendIcon className="h-4 w-4" />
            <span className="font-medium">
              {trend > 0 ? '+' : ''}{trend}% this week
            </span>
          </div>
        )}
      </div>

      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              dy={10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${dataKey})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
