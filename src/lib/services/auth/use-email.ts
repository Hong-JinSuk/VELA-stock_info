import { api } from '@/lib/api/axios';
import { ApiResponse } from '@/lib/api/response';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

type VerificationStep = 'idle' | 'sent' | 'verified';

export function useEmail() {
  const [step, setStep] = useState<VerificationStep>('idle');

  const duplicateEmail = useMutation({
    mutationKey: ['duplicate-email'],
    mutationFn: async (email: string): Promise<ApiResponse<boolean>> => {
      const { data } = await api.post('/auth/duplicate-email', { email });
      return data;
    },
    meta: { ignoreGlobalError: true },
  });

  const sendCode = useMutation({
    mutationKey: ['send-code'],
    mutationFn: async (email: string): Promise<ApiResponse<null>> => {
      const { data } = await api.post('/auth/send-code', { email });
      return data;
    },
    onSuccess: () => setStep('sent'),
    meta: { ignoreGlobalError: true },
  });

  const verifyCode = useMutation({
    mutationKey: ['verify-code'],
    mutationFn: async ({
      email,
      code,
    }: {
      email: string;
      code: string;
    }): Promise<ApiResponse<null>> => {
      const { data } = await api.post('/auth/verify-code', { email, code });
      return data;
    },
    onSuccess: () => setStep('verified'),
    meta: { ignoreGlobalError: true },
  });

  const reset = () => {
    setStep('idle');
    sendCode.reset();
    verifyCode.reset();
  };

  return {
    step,
    isVerified: step === 'verified',
    duplicateEmail,
    sendCode,
    verifyCode,
    reset,
  };
}
