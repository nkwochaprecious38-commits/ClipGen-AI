'use client';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
export function UsageChart({ data, xKey = 'label' }: { data: { label: string; credits: number }[]; xKey?: string }) {
  if (!data.length || data.every((d) => d.credits === 0)) return <p className="py-10 text-center text-sm text-mute">No credit usage recorded yet.</p>;
  return (
    <div className="h-56 w-full" role="img" aria-label="Credit usage chart">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#2D2D35" vertical={false} />
          <XAxis dataKey={xKey} stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip cursor={{ fill: 'rgba(139,92,246,.08)' }} contentStyle={{ background: '#202127', border: '1px solid #2D2D35', borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="credits" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
