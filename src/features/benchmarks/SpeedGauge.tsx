interface Props {
  tokensPerSecond: number;
}

export function SpeedGauge({ tokensPerSecond }: Props) {
  // Color zones: red < 10, amber 10-30, green > 30
  let color = "#D93025"; // red
  let label = "Slow";
  if (tokensPerSecond >= 30) {
    color = "#34A853";
    label = "Fast";
  } else if (tokensPerSecond >= 10) {
    color = "#F9AB00";
    label = "Moderate";
  }

  // Arc: 0-100 tok/s mapped to 0-180 degrees
  const maxTokS = 100;
  const angle = Math.min((tokensPerSecond / maxTokS) * 180, 180);
  const radians = (angle * Math.PI) / 180;

  // SVG arc path (semicircle from left to right)
  const cx = 100, cy = 100, r = 80;
  const startX = cx - r;
  const startY = cy;
  const endX = cx - r * Math.cos(radians);
  const endY = cy - r * Math.sin(radians);
  const largeArc = angle > 90 ? 1 : 0;

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* Background arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--color-outline-variant)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Active arc */}
        {tokensPerSecond > 0 && (
          <path
            d={`M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        )}
        {/* Center text */}
        <text x={cx} y={cy - 15} textAnchor="middle" fill="var(--color-on-surface)" fontSize="28" fontWeight="bold" fontFamily="var(--font-sans)">
          {tokensPerSecond}
        </text>
        <text x={cx} y={cy + 5} textAnchor="middle" fill="var(--color-on-surface-variant)" fontSize="11" fontFamily="var(--font-sans)">
          tok/s
        </text>
      </svg>
      <span className="text-xs font-semibold mt-1" style={{ color }}>{label}</span>
    </div>
  );
}
