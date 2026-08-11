import { api } from '@/lib/api/axios';
import { useMutation } from '@tanstack/react-query';

export type ContactData = {
  author: string;
  authorEmail: string;
  title: string;
  content: string;
  /** 봇 트랩(honeypot). 사람이 채울 일이 없는 숨김 필드. */
  website?: string;
};

export function useContact() {
  const postContact = useMutation({
    mutationKey: ['post-contact'],
    mutationFn: async (form: ContactData) => {
      const { data } = await api.post('/mail', form);
      return data;
    },
    meta: {
      ignoreGlobalError: true,
    },
  });

  return { postContact };
}
