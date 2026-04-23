'use client';

import { api } from '@/lib/api/axios';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export default function TestPage() {
  const router = useRouter();
  const { refetch, isFetching } = useQuery({
    queryKey: ['test-success'],
    queryFn: async () => {
      const { data } = await api.get(
        'https://jsonplaceholder.typicode.com/todos/1',
      );
      if (data.code !== 200) throw new Error('에러 메세지!');
    },
    enabled: false,
  });

  const { mutate: failDefault, isPending: isPendingDefault } = useMutation({
    mutationFn: () => api.get('/non-existent-endpoint'),
  });

  const { mutate: failCustom, isPending: isPendingCustom } = useMutation({
    mutationFn: async () => {
      try {
        return await api.get('/non-existent-endpoint');
      } catch {
        throw new Error('vela 에서 제공되지 않는 서비스입니다.');
      }
    },
  });

  return (
    <div className="flex gap-4 p-10">
      <button
        onClick={() => refetch()}
        disabled={isFetching}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {isFetching ? '로딩중...' : '성공 요청'}
      </button>

      <button
        onClick={() => failDefault()}
        disabled={isPendingDefault}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        {isPendingDefault ? '로딩중...' : '실패 요청 (기본 메시지)'}
      </button>

      <button
        onClick={() => failCustom()}
        disabled={isPendingCustom}
        className="px-4 py-2 bg-orange-500 text-white rounded"
      >
        {isPendingCustom ? '로딩중...' : '실패 요청 (커스텀 메시지)'}
      </button>
      <button
        onClick={() => router.push('/welcome')}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      ></button>
    </div>
  );
}
