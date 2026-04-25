// src/lib/api-response.ts
import { NextResponse } from 'next/server';

export type ApiResponse<T = any> = {
  message: string;
  status: number;
  result: T;
};

export function createResponse<T>(message: string, status: number, result: T) {
  return NextResponse.json({ message, status, result }, { status });
}
