import { SITE_NAME } from '@/constants/seo';
import { ImageResponse } from 'next/og';

// 공유 카드(카카오/슬랙/X 등)에 쓰이는 기본 OG 이미지. twitter 이미지도 이 값을 물려받는다.
// ⚠️ 한글은 넣지 않는다 — ImageResponse 기본 폰트에 한글 글리프가 없어 깨진다.
// (한글을 넣으려면 폰트 파일을 번들에 추가해 fonts 옵션으로 주입해야 한다.)
export const alt = 'VELA — Market Intelligence';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const ACCENT = '#3B82F6';
const BG = '#0F1115';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: BG,
          color: '#F8FAFC',
          padding: 80,
        }}
      >
        {/* 로고 마크 + 워드마크 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <svg width="72" height="72" viewBox="0 0 52 52" fill="none">
            <circle cx="26" cy="26" r="22" stroke="#F8FAFC" strokeWidth="1.2" />
            <polyline
              points="13,34 22,24 29,29 40,17"
              stroke={ACCENT}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="40" cy="17" r="2.6" fill={ACCENT} />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 44, letterSpacing: 12, lineHeight: 1 }}>
              {SITE_NAME}
            </div>
            <div
              style={{
                fontSize: 18,
                letterSpacing: 8,
                lineHeight: 1,
                color: '#94A3B8',
              }}
            >
              MARKET INTELLIGENCE
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ display: 'flex', width: 96, height: 3, background: ACCENT }} />
          <div style={{ display: 'flex', fontSize: 62, lineHeight: 1.25 }}>
            Only the signals that
          </div>
          <div style={{ display: 'flex', fontSize: 62, lineHeight: 1.25 }}>
            move your decision.
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: '#94A3B8' }}>
            13F holdings · Market &amp; sector indicators · Fair value
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
