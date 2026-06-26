// PostHog 이벤트 캡처 얇은 래퍼.
// - 키가 없으면(미설정) / 서버사이드면 no-op → 어디서 호출해도 안전.
// - 호출부는 try/catch 없이 capture('event', { ... })만 쓰면 된다.
import posthog from 'posthog-js';

const ENABLED =
  typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_POSTHOG_KEY;

export function capture(
  event: string,
  props?: Record<string, unknown>,
): void {
  if (!ENABLED) return;
  try {
    posthog.capture(event, props);
  } catch {
    // 애널리틱스 실패가 앱 동작을 막지 않도록 무시.
  }
}
