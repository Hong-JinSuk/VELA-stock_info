import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
