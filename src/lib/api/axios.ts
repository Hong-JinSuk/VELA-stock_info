// // src/lib/api/axios.ts
// import { ApiResponse } from '@/lib/api/response';
// import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// // 1. 우리가 사용할 메서드들만 타입을 재정의합니다.
// interface CustomInstance extends AxiosInstance {
//   get<T = any, R = ApiResponse<T>>(
//     url: string,
//     config?: AxiosRequestConfig,
//   ): Promise<R>;
//   post<T = any, R = ApiResponse<T>>(
//     url: string,
//     data?: any,
//     config?: AxiosRequestConfig,
//   ): Promise<R>;
//   put<T = any, R = ApiResponse<T>>(
//     url: string,
//     data?: any,
//     config?: AxiosRequestConfig,
//   ): Promise<R>;
//   patch<T = any, R = ApiResponse<T>>(
//     url: string,
//     data?: any,
//     config?: AxiosRequestConfig,
//   ): Promise<R>;
//   delete<T = any, R = ApiResponse<T>>(
//     url: string,
//     config?: AxiosRequestConfig,
//   ): Promise<R>;
// }

// const PREFIX = process.env.NEXT_PUBLIC_API_PATH;

// // 2. 인스턴스를 생성할 때 위에서 만든 타입을 입혀줍니다.
// export const api = axios.create({
//   baseURL: `${PREFIX}`,
//   timeout: 10000,
//   withCredentials: true,
// }) as CustomInstance; // <- 핵심: 타입 캐스팅

// // 3. 응답 인터셉터에서 실제 알맹이(data)만 넘겨줍니다.
// api.interceptors.response.use((res) => res.data);

// 기존에 잘되던것
import axios from 'axios';
import { errorInterceptors } from './error-enterceptors';

const PREFIX = process.env.NEXT_PUBLIC_API_PATH;

export const api = axios.create({
  baseURL: `${PREFIX}`,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

errorInterceptors(api);
