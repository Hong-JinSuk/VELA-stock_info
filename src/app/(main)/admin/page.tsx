import { ListChecks, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import AdminBatchActions from './components/batch-actions';

const MANAGE_LINKS = [
  {
    href: '/admin/menus',
    title: '메뉴 관리',
    desc: '사이드바 메뉴를 추가·수정·삭제·정렬하고 접근 등급/노출을 설정합니다.',
    icon: ShieldCheck,
  },
  {
    href: '/admin/sectors',
    title: '섹터 분석 관리',
    desc: '섹터(종목 바구니)를 만들고 종목·ETF를 추가합니다.',
    icon: ListChecks,
  },
];

export default function AdminIndexPage() {
  return (
    <main className="flex flex-1 min-h-0 flex-col gap-8 overflow-y-auto no-scrollbar p-6">
      <header>
        <h1 className="font-serif text-xl tracking-tight">관리</h1>
        <p className="mt-1 text-sm text-muted-foreground break-keep">
          ADMIN 전용 관리 도구.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">메뉴 관리</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {MANAGE_LINKS.map(({ href, title, desc, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-3 rounded-2xl border border-border bg-card/40 p-5 transition-colors hover:bg-accent/40"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground break-keep">
                  {desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">수동 배치</h2>
        <p className="-mt-1 text-xs text-muted-foreground break-keep">
          평소엔 cron이 자동 실행합니다. 즉시 갱신이 필요할 때만 사용하세요.
        </p>
        <AdminBatchActions />
      </section>
    </main>
  );
}
