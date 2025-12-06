import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function StressVsSleepChart() {
  // Mock data showing inverse correlation between sleep and stress
  const data = [
    { sleep: 5, stress: 7, date: 'Day 1' },
    { sleep: 6, stress: 6, date: 'Day 2' },
    { sleep: 5.5, stress: 5, date: 'Day 3' },
    { sleep: 7, stress: 4, date: 'Day 4' },
    { sleep: 8, stress: 3, date: 'Day 5' },
    { sleep: 7.5, stress: 3.5, date: 'Day 6' },
    { sleep: 9, stress: 2, date: 'Day 7' },
  ];

  const correlation = -0.82;

  return (
    <div className="glass-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-medium text-foreground">Stress vs Sleep</span>
        <span className="text-sm text-muted-foreground">
          Correlation: <span className="text-primary font-medium">{correlation}</span>
        </span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid 
              stroke="hsl(var(--border))"
              strokeOpacity={0.3}
            />
            <XAxis 
              type="number" 
              dataKey="sleep" 
              name="Sleep" 
              unit="h"
              domain={[4, 10]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              label={{ 
                value: 'Sleep (h)', 
                position: 'bottom', 
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 11,
                offset: 0
              }}
            />
            <YAxis 
              type="number" 
              dataKey="stress" 
              name="Stress"
              domain={[0, 10]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              label={{ 
                value: 'Stress', 
                angle: -90, 
                position: 'insideLeft',
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 11,
              }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string) => [
                name === 'sleep' ? `${value}h` : value,
                name === 'sleep' ? 'Sleep' : 'Stress Level'
              ]}
            />
            <Scatter name="Data" data={data}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill="hsl(var(--primary))"
                  opacity={0.8}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
