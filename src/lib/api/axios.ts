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
