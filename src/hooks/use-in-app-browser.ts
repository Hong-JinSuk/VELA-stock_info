'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type InAppType =
  | 'kakaotalk'
  | 'naver'
  | 'line'
  | 'instagram'
  | 'facebook'
  | null;

export type MobileOs = 'ios' | 'android' | 'other';

export interface InAppBrowserState {
  /** 인앱(웹뷰) 브라우저에서 열렸는지 여부 */
  isInApp: boolean;
  /** 감지된 인앱 종류 (없으면 null) */
  type: InAppType;
  /** 모바일 OS */
  os: MobileOs;
  /** 현재 페이지를 외부 브라우저로 자동 전환 가능한지 (kakaotalk 전체 / android 전체) */
  canAutoEscape: boolean;
  /** 현재 URL을 외부(시스템 기본) 브라우저로 다시 연다 */
  openExternal: () => void;
}

/** 인앱 웹뷰 식별용 User-Agent 패턴 */
const IN_APP_UA_PATTERNS: { type: Exclude<InAppType, null>; pattern: RegExp }[] =
  [
    { type: 'kakaotalk', pattern: /KAKAOTALK/i },
    { type: 'naver', pattern: /NAVER\(inapp/i },
    { type: 'line', pattern: /\bLine\//i },
    { type: 'instagram', pattern: /Instagram/i },
    { type: 'facebook', pattern: /FBAN|FBAV/i },
  ];

function detectType(ua: string): InAppType {
  return (
    IN_APP_UA_PATTERNS.find(({ pattern }) => pattern.test(ua))?.type ?? null
  );
}

function detectOs(ua: string): MobileOs {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

// User-Agent는 런타임 동안 바뀌지 않으므로 구독은 no-op.
const subscribe = () => () => {};
const getUserAgent = () =>
  typeof navigator === 'undefined' ? '' : navigator.userAgent;
const getServerUserAgent = () => '';

/**
 * 카카오톡 등 인앱 웹뷰를 감지하고, 외부 브라우저로 탈출시키는 훅.
 * 구글 OAuth가 인앱 웹뷰에서 `disallowed_useragent`(403)로 차단되는 문제를 회피하기 위함.
 *
 * SSR 시점에는 빈 UA(= 인앱 아님)로 취급하고, 클라이언트 마운트 후 실제 UA로 동기화한다.
 */
export function useInAppBrowser(): InAppBrowserState {
  const ua = useSyncExternalStore(
    subscribe,
    getUserAgent,
    getServerUserAgent,
  );

  const type = detectType(ua);
  const os = detectOs(ua);

  const openExternal = useCallback(() => {
    const url = window.location.href;

    // 카카오톡: 자체 스킴으로 iOS/안드 모두 시스템 기본 브라우저로 탈출 가능
    if (type === 'kakaotalk') {
      window.location.href =
        'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
      return;
    }

    // 그 외 인앱: 안드로이드는 intent 스킴으로 크롬으로 탈출
    if (os === 'android') {
      const withoutScheme = url.replace(/^https?:\/\//, '');
      window.location.href =
        'intent://' +
        withoutScheme +
        '#Intent;scheme=https;package=com.android.chrome;end';
      return;
    }

    // iOS의 기타 인앱(인스타/페북/라인 등)은 JS 자동 탈출 불가 → 안내만 (no-op)
  }, [type, os]);

  const isInApp = type !== null;
  const canAutoEscape = type === 'kakaotalk' || os === 'android';

  return { isInApp, type, os, canAutoEscape, openExternal };
}
