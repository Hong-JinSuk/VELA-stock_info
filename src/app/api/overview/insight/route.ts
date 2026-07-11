import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// 스냅샷은 매일 08:00 KST에 그날 날짜로 저장된다.
// 따라서 조회 dateKey도 "직전 08:00 KST가 속한 날짜"여야 한다.
// KST(+9) - 8h = UTC + 1h 의 날짜 부분을 쓰면 자동으로 처리됨
// (KST 07:59 → 전날, KST 08:00 → 당일).
function getInsightDateKey(): string {
  const shifted = new Date(Date.now() + 1 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

export async function GET() {
  const todayKey = getInsightDateKey();

  try {
    let snapshot = await prisma.dailySnapshot.findUnique({
      where: { type_dateKey: { type: 'AI_INSIGHT', dateKey: todayKey } },
    });

    // 오늘 스냅샷이 없으면 가장 최신 것으로 fallback (cron 실패 등 대비).
    if (!snapshot) {
      snapshot = await prisma.dailySnapshot.findFirst({
        where: { type: 'AI_INSIGHT' },
        orderBy: { dateKey: 'desc' },
      });
    }

    if (!snapshot) {
      console.warn('[OVERVIEW_INSIGHT] no snapshot available');
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json({
      insight: snapshot.payload,
      dateKey: snapshot.dateKey,
      isToday: snapshot.dateKey === todayKey,
    });
  } catch (error) {
    console.error('[OVERVIEW_INSIGHT] failed:', error);
    return NextResponse.json({ message: '인사이트 조회 실패' }, { status: 500 });
  }
}
