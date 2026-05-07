import axios, { AxiosInstance } from 'axios';
import { STATUS_MESSAGES } from './error-message';

export function errorInterceptors(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message =
          error.response?.data?.message ??
          (status ? STATUS_MESSAGES[status] : null) ??
          '알 수 없는 오류가 발생했습니다.';

        throw new Error(message);
      }

      throw error;
    },
  );
}
