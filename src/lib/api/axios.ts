// 기존에 잘되던것
import axios from 'axios';
import { errorInterceptors } from './error-interceptors';

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
