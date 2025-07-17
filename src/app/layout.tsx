
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/context/language-context';

export const metadata: Metadata = {
  title: 'Expense Tracker - Personal Expense Tracker',
  description: 'Track your expenses and manage your finances with Expense Tracker.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <LanguageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
