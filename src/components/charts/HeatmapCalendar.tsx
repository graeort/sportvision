import type { SessionRecord } from '../../store/appStore';

interface HeatmapCalendarProps {
  sessions: SessionRecord[];
  weeks?: number;
}

export function HeatmapCalendar({ sessions, weeks = 12 }: HeatmapCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build day map
  const dayMap: Record<string, number> = {};
  sessions.forEach((s) => {
    const d = new Date(s.date);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    dayMap[key] = (dayMap[key] || 0) + 1;
  });

  // Build grid: weeks columns, 7 rows (Sun-Sat)
  const cellSize = 12;
  const gap = 2;
  const labelHeight = 16;
  const dayLabelWidth = 20;

  // Start from Sunday of the week 'weeks' ago
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (weeks * 7) + 1);
  // Align to Sunday
  const startDay = startDate.getDay();
  startDate.setDate(startDate.getDate() - startDay);

  const days: { date: Date; count: number }[] = [];
  const current = new Date(startDate);
  while (current <= today) {
    const key = current.toISOString().slice(0, 10);
    days.push({ date: new Date(current), count: dayMap[key] || 0 });
    current.setDate(current.getDate() + 1);
  }

  const totalWeeks = Math.ceil(days.length / 7);
  const svgWidth = dayLabelWidth + totalWeeks * (cellSize + gap);
  const svgHeight = labelHeight + 7 * (cellSize + gap);

  const getColor = (count: number) => {
    if (count === 0) return 'rgba(255,255,255,0.05)';
    if (count === 1) return '#1d4ed8';
    if (count === 2) return '#2563eb';
    return '#3b82f6';
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Month labels
  const monthLabels: { x: number; label: string }[] = [];
  let lastMonth = -1;
  days.forEach((day, i) => {
    const weekIdx = Math.floor(i / 7);
    const month = day.date.getMonth();
    if (month !== lastMonth && day.date.getDay() === 0) {
      monthLabels.push({
        x: dayLabelWidth + weekIdx * (cellSize + gap),
        label: day.date.toLocaleDateString('en-US', { month: 'short' }),
      });
      lastMonth = month;
    }
  });

  return (
    <div className="overflow-x-auto">
      <svg width={svgWidth} height={svgHeight} style={{ minWidth: svgWidth }}>
        {/* Day labels */}
        {dayNames.map((name, i) => (
          <text
            key={i}
            x={dayLabelWidth - 4}
            y={labelHeight + i * (cellSize + gap) + cellSize / 2}
            textAnchor="end"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.3)"
            fontSize="8"
          >
            {i % 2 === 1 ? name : ''}
          </text>
        ))}

        {/* Month labels */}
        {monthLabels.map((m) => (
          <text
            key={m.x}
            x={m.x}
            y={labelHeight - 4}
            fill="rgba(255,255,255,0.4)"
            fontSize="9"
          >
            {m.label}
          </text>
        ))}

        {/* Cells */}
        {days.map((day, i) => {
          const weekIdx = Math.floor(i / 7);
          const dayIdx = i % 7;
          const x = dayLabelWidth + weekIdx * (cellSize + gap);
          const y = labelHeight + dayIdx * (cellSize + gap);
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              rx="2"
              fill={getColor(day.count)}
            >
              <title>{`${day.date.toLocaleDateString()}: ${day.count} session${day.count !== 1 ? 's' : ''}`}</title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}
