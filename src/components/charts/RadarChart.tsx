interface RadarSeries {
  data: { label: string; value: number; max: number }[];
  color: string;
  label?: string;
}

interface RadarChartProps {
  series: RadarSeries[];
  size?: number;
}

export function RadarChart({ series, size = 280 }: RadarChartProps) {
  if (!series.length || !series[0].data.length) return null;

  const labels = series[0].data.map((d) => d.label);
  const n = labels.length;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;

  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const getPoint = (index: number, r: number) => {
    const angle = startAngle + index * angleStep;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid */}
      {gridLevels.map((level) => {
        const pts = Array.from({ length: n }, (_, i) => getPoint(i, radius * level));
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
        return (
          <path
            key={level}
            d={d}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        );
      })}

      {/* Axis lines */}
      {Array.from({ length: n }, (_, i) => {
        const outer = getPoint(i, radius);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={outer.x}
            y2={outer.y}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        );
      })}

      {/* Data polygons */}
      {series.map((s, si) => {
        const pts = s.data.map((d, i) =>
          getPoint(i, radius * (d.value / (d.max || 100)))
        );
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
        return (
          <g key={si}>
            <path
              d={d}
              fill={s.color}
              fillOpacity={0.2}
              stroke={s.color}
              strokeWidth="2"
            />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3" fill={s.color} />
            ))}
          </g>
        );
      })}

      {/* Labels */}
      {labels.map((label, i) => {
        const pt = getPoint(i, radius + 22);
        const textAnchor =
          Math.abs(pt.x - cx) < 5 ? 'middle' : pt.x < cx ? 'end' : 'start';
        return (
          <text
            key={i}
            x={pt.x}
            y={pt.y}
            textAnchor={textAnchor}
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.7)"
            fontSize="11"
            fontWeight="500"
          >
            {label}
          </text>
        );
      })}

      {/* Legend */}
      {series.length > 1 &&
        series.map((s, i) => (
          <g key={i} transform={`translate(${12}, ${size - 20 - i * 18})`}>
            <rect width="10" height="10" fill={s.color} fillOpacity={0.8} rx="2" />
            <text x="14" y="9" fill="rgba(255,255,255,0.6)" fontSize="10">
              {s.label}
            </text>
          </g>
        ))}
    </svg>
  );
}
