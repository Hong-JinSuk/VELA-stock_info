import ModalProvider from '@/components/providers/modal-provider';
import QueryProvider from '@/components/providers/query-provider';
import ToastProvider from '@/components/providers/toast-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import AuthContext from '@/context/auth-context';
import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Geist, Geist_Mono } from 'next/font/google';
import './blue.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'VELA',
  description: 'Stock Insight by realtone',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning // ThemeProvider 때문에 class에 theme mode 에러발생 방지
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AuthContext>
          <QueryProvider>
            <TooltipProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
              <ModalProvider />
            </TooltipProvider>
          </QueryProvider>
        </AuthContext>
        <ToastProvider />
      </body>
    </html>
  );
}
