import { useId } from 'react';

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
};

/**
 * 시계열 sparkline (inline SVG). 상승=emerald, 하락=red, 라인 아래 그라데이션 채움.
 * 데이터가 2개 미만이면 placeholder(—) 표시.
 *
 * 가로는 부모(셀) 폭을 꽉 채우도록 viewBox 스케일링(preserveAspectRatio="none"),
 * 선 굵기는 vector-effect로 고정. width/height는 좌표계 기준값.
 */
export default function Sparkline({
  data,
  width = 72,
  height = 28,
}: SparklineProps) {
  const gradientId = useId();
  if (data.length < 2) {
    return <span className="text-muted-foreground/40">—</span>;
  }
  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const coords = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = height - pad - ((v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = coords
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  // 라인 아래 채움 영역: 라인 점들 → 오른쪽 끝 바닥 → 왼쪽 끝 바닥 (polygon 자동 닫힘).
  const area = `${line} ${coords[coords.length - 1][0].toFixed(1)},${height} ${coords[0][0].toFixed(1)},${height}`;
  const up = data[data.length - 1] >= data[0];
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ height }}
      className={`w-full ${up ? 'text-emerald-500' : 'text-red-500'}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.3} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradientId})`} stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
