// ─── VELA Logo ───────────────────────────────────────────────────────────────
// 사용법:
//   <VelaLogo />                     → 라이트 (기본)
//   <VelaLogo variant="dark" />      → 다크모드
//   <VelaLogo variant="navy" />      → 딥 네이비
//   <VelaLogo variant="blue" />      → 소프트 블루
//   <VelaLogo size={40} />           → 아이콘만 (워드마크 없이)
//   <VelaLogo showWordmark={false} /> → 아이콘만
// ─────────────────────────────────────────────────────────────────────────────

type Variant = 'light' | 'dark' | 'navy' | 'blue';

interface VelaLogoProps {
  variant?: Variant;
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

const PALETTE: Record<
  Variant,
  { bg: string; mark: string; brand: string; sub: string }
> = {
  light: { bg: '#F8F7F5', mark: '#0E0E0E', brand: '#0E0E0E', sub: '#999999' },
  dark: { bg: '#0E0E0E', mark: '#F0EEE8', brand: '#F0EEE8', sub: '#555555' },
  navy: { bg: '#1A1A2E', mark: '#C8B8E8', brand: '#C8B8E8', sub: '#5A5A7A' },
  blue: { bg: '#EBF0F7', mark: '#1A4080', brand: '#1A4080', sub: '#7090B0' },
};

// ── 마크 SVG (원 + 꺾인선 + 끝점) ──────────────────────────────────────────
function VelaMark({ color, size = 52 }: { color: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="26" cy="26" r="22" stroke={color} strokeWidth="1.2" />
      <polyline
        points="13,34 22,24 29,29 40,17"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="40" cy="17" r="2.2" fill={color} />
    </svg>
  );
}

// ── 풀 로고 컴포넌트 ────────────────────────────────────────────────────────
export default function VelaLogo({
  variant = 'light',
  size = 52,
  showWordmark = true,
  className = '',
}: VelaLogoProps) {
  const { mark, brand, sub } = PALETTE[variant];

  return (
    <div
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 18 }}
    >
      <VelaMark color={mark} size={size} />
      {showWordmark && (
        <>
          {/* 구분선 */}
          <div
            style={{
              width: 1,
              height: size * 0.77,
              background: mark,
              opacity: 0.15,
            }}
          />

          {/* 워드마크 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 300,
                letterSpacing: '0.24em',
                fontSize: size * 0.42,
                lineHeight: 1,
                color: brand,
              }}
            >
              VELA
            </span>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 200,
                letterSpacing: '0.32em',
                fontSize: size * 0.19,
                lineHeight: 1,
                color: sub,
              }}
            >
              MARKET&nbsp;&nbsp;INTELLIGENCE
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── 배경 포함 버전 (Splash / 카드용) ─────────────────────────────────────
export function VelaLogoBadge({ variant = 'light' }: { variant?: Variant }) {
  const { bg } = PALETTE[variant];
  return (
    <div
      style={{
        background: bg,
        borderRadius: 16,
        padding: '32px 40px',
        display: 'inline-flex',
      }}
    >
      <VelaLogo variant={variant} />
    </div>
  );
}

// ─── 순수 SVG 문자열 (파비콘 / OG 이미지 / 서버사이드 렌더링용) ─────────────
export const velaMarkSVG = (color = '#0E0E0E') =>
  `
<svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="26" cy="26" r="22" stroke="${color}" stroke-width="1.2"/>
  <polyline points="13,34 22,24 29,29 40,17"
    stroke="${color}" stroke-width="1.4"
    stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="40" cy="17" r="2.2" fill="${color}"/>
</svg>
`.trim();

/*
  폰트 로드 (index.html 또는 layout.tsx 에 추가)
  ──────────────────────────────────────────────────────
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300&family=Sora:wght@300&display=swap" rel="stylesheet" />
*/
