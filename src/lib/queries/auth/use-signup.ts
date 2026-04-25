// src/lib/queries/auth/use-signup.ts
import { api } from '@/lib/api/axios';
import { ApiResponse } from '@/lib/api/response';
import { User } from '@/types/user';
import { useMutation } from '@tanstack/react-query';

export type SignupData = {
  email: string;
  name: string;
  password: string;
};

export function useSignup() {
  const signup = useMutation({
    mutationKey: ['signup'],
    mutationFn: async (data: SignupData): Promise<ApiResponse<User>> => {
      const { data: res } = await api.post('/auth/signup', data);
      return res;
    },
    meta: { ignoreGlobalError: true },
  });

  return { signup };
}
