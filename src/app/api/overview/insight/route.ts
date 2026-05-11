import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

function getKstDateKey(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export async function GET() {
  const snapshot = await prisma.dailySnapshot.findUnique({
    where: { type_dateKey: { type: 'AI_INSIGHT', dateKey: getKstDateKey() } },
  });

  if (!snapshot) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json(snapshot.payload);
}
