// KST(UTC+9) 벽시계 헬퍼. DB timestamp는 KST 벽시계로 저장한다(CLAUDE.md).
// Prisma DateTime(timestamp, tz 없음)에 이 Date를 넣으면 UTC 필드가 곧 KST 벽시계가 되어
// Supabase 콘솔에서 별도 변환 없이 KST로 보인다.
export function kstNow(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

// KST 벽시계로 저장된 ISO 문자열(= UTC 필드가 곧 KST)을 상대시간으로 표시.
// 저장값이 KST-as-UTC라서 현재시각도 동일 프레임(Date.now()+9h)으로 맞춰 비교한다.
export function formatRelativeFromKstIso(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const nowKst = Date.now() + 9 * 60 * 60 * 1000;
  const sec = Math.max(0, Math.floor((nowKst - then) / 1000));
  if (sec < 60) return '방금 전';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return `${iso.slice(5, 7)}/${iso.slice(8, 10)}`; // 오래된 건 MM/DD (KST)
}
