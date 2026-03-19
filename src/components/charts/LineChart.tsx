interface LineChartProps {
  data: { date: string; value: number }[];
  color?: string;
  height?: number;
  width?: number;
}

export function LineChart({ data, color = '#3b82f6', height = 120, width = 400 }: LineChartProps) {
  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="12">
          Not enough data
        </text>
      </svg>
    );
  }

  const pad = { top: 10, right: 10, bottom: 24, left: 32 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;

  const values = data.map((d) => d.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const toX = (i: number) => pad.left + (i / (data.length - 1)) * w;
  const toY = (v: number) => pad.top + h - ((v - minV) / range) * h;

  const points = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath =
    linePath +
    ` L${points[points.length - 1].x},${pad.top + h} L${points[0].x},${pad.top + h} Z`;

  const gradId = `grad-${color.replace('#', '')}`;

  // Y axis labels
  const yTicks = [0, 0.5, 1].map((t) => ({
    value: Math.round(minV + t * range),
    y: toY(minV + t * range),
  }));

  // X axis labels (show first, middle, last)
  const xTicks = [0, Math.floor(data.length / 2), data.length - 1].map((i) => ({
    x: toX(i),
    label: new Date(data[i].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />

      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}

      {/* Y axis ticks */}
      {yTicks.map((t) => (
        <g key={t.value}>
          <line x1={pad.left - 4} y1={t.y} x2={pad.left} y2={t.y} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <text x={pad.left - 6} y={t.y} textAnchor="end" dominantBaseline="middle" fill="rgba(255,255,255,0.4)" fontSize="9">
            {t.value}
          </text>
        </g>
      ))}

      {/* X axis labels */}
      {xTicks.map((t) => (
        <text key={t.x} x={t.x} y={height - 4} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">
          {t.label}
        </text>
      ))}

      {/* Axis */}
      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + h} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <line x1={pad.left} y1={pad.top + h} x2={pad.left + w} y2={pad.top + h} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
    </svg>
  );
}
