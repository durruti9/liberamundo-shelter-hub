import { TooltipProps } from 'recharts';

/**
 * Themed Recharts tooltip that respects light/dark mode.
 * Usage: <Tooltip content={<ChartTooltip />} />
 */
export default function ChartTooltip({ active, payload, label }: TooltipProps<any, any>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      {label && <p className="text-sm font-medium text-card-foreground mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color || 'hsl(var(--primary))' }}>
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}
