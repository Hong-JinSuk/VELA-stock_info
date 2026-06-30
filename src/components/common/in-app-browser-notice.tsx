'use client';

import { Button } from '@/components/ui/button';
import { InAppType, useInAppBrowser } from '@/hooks/use-in-app-browser';
import { IconAlertTriangle, IconExternalLink } from '@tabler/icons-react';

const IN_APP_LABEL: Record<Exclude<InAppType, null>, string> = {
  kakaotalk: '카카오톡',
  naver: '네이버 앱',
  line: '라인',
  instagram: '인스타그램',
  facebook: '페이스북',
};

/**
 * 인앱 웹뷰에서 열렸을 때 구글 로그인 차단(disallowed_useragent)을 안내하고
 * 외부 브라우저로 탈출하도록 유도하는 배너. 인앱이 아니면 아무것도 렌더링하지 않는다.
 */
export default function InAppBrowserNotice() {
  const { isInApp, type, canAutoEscape, openExternal } = useInAppBrowser();

  if (!isInApp) return null;

  const appLabel = (type && IN_APP_LABEL[type]) || '인앱';

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
      <div className="flex items-start gap-2">
        <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div className="flex flex-col gap-2">
          <p className="font-medium break-keep">
            {appLabel} 인앱 브라우저에서는 구글 로그인이 차단됩니다.
          </p>
          {canAutoEscape ? (
            <>
              <p className="break-keep text-amber-800/90 dark:text-amber-200/80">
                외부 브라우저로 열면 정상적으로 로그인할 수 있어요.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={openExternal}
                className="w-fit gap-1 bg-amber-500 text-white hover:bg-amber-600"
              >
                <IconExternalLink className="size-4" />
                외부 브라우저로 열기
              </Button>
            </>
          ) : (
            <p className="break-keep text-amber-800/90 dark:text-amber-200/80">
              오른쪽 위 또는 아래 메뉴에서{' '}
              <span className="font-semibold">‘다른 브라우저로 열기’</span>
              (Safari 등)를 눌러 접속해주세요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
