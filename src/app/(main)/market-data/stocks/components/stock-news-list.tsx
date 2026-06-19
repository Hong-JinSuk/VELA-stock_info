'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { StockNewsItem } from '@/types/stock';
import { Newspaper } from 'lucide-react';

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

function NewsCard({ item }: { item: StockNewsItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl border border-border bg-card/40 overflow-hidden hover:border-border/80 hover:bg-card/60 transition-colors"
    >
      {item.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image}
          alt=""
          className="w-full h-44 object-cover"
          loading="lazy"
        />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5">
          <span className="font-semibold uppercase tracking-wide">
            {item.source}
          </span>
          <span>•</span>
          <span>{formatDate(item.datetime)}</span>
        </div>
        <h3 className="text-sm font-semibold leading-snug line-clamp-2">
          {item.headline}
        </h3>
        {item.summary && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
            {item.summary}
          </p>
        )}
      </div>
    </a>
  );
}

export default function StockNewsList({
  news,
  loading,
}: {
  news: StockNewsItem[];
  loading: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-base font-semibold mb-4">
        <Newspaper className="w-4 h-4" />
        최근 관련 뉴스
      </div>
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card/40 p-4 space-y-2"
            >
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground/60">
          관련 뉴스가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {news.map((item) => (
            <NewsCard key={item.url} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
