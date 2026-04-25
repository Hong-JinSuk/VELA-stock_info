import { api } from '@/lib/api/axios';
import { useMutation } from '@tanstack/react-query';

export type ContactData = {
  author: string;
  authorEmail: string;
  title: string;
  content: string;
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
