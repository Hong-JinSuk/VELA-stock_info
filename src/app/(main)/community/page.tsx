import { redirect } from 'next/navigation';

// 커뮤니티 루트는 현재 사용 후기 단일 보드 → 바로 리다이렉트.
export default function CommunityIndexPage() {
  redirect('/community/reviews');
}
