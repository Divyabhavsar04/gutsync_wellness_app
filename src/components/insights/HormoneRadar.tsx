import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Lightbulb } from 'lucide-react';

interface HormoneRadarProps {
  data: {
    dopamine: number;
    cortisol: number;
    estrogen: number;
    testosterone: number;
    melatonin: number;
    serotonin: number;
  };
}

export function HormoneRadar({ data }: HormoneRadarProps) {
  const chartData = [
    { hormone: 'Cortisol', value: data.cortisol, fullMark: 100 },
    { hormone: 'Estrogen', value: data.estrogen, fullMark: 100 },
    { hormone: 'Testosterone', value: data.testosterone, fullMark: 100 },
    { hormone: 'Melatonin', value: data.melatonin, fullMark: 100 },
    { hormone: 'Serotonin', value: data.serotonin, fullMark: 100 },
    { hormone: 'Dopamine', value: data.dopamine, fullMark: 100 },
  ];

  return (
    <div className="glass-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-primary" />
        <span className="font-medium text-foreground">Hormone Stability</span>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid 
              stroke="hsl(var(--border))"
              strokeOpacity={0.5}
            />
            <PolarAngleAxis 
              dataKey="hormone"
              tick={{ 
                fill: 'hsl(var(--muted-foreground))', 
                fontSize: 11,
              }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickCount={5}
            />
            <Radar
              name="Stability"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        {chartData.map((item) => (
          <div key={item.hormone} className="flex items-center justify-between rounded-lg bg-secondary/50 px-2 py-1">
            <span className="text-muted-foreground">{item.hormone}</span>
            <span className="font-medium text-foreground">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
