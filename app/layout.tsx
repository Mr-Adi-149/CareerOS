import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { AppWrapper } from '@/components/app-wrapper';
import { SavedProvider } from '@/components/saved-provider';
import { CareerProvider } from '@/lib/state';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit'
});

export const metadata: Metadata = {
  title: 'Niyukti — Premium Opportunities for India\'s Talent',
  description: 'A trustworthy, India-first hiring platform connecting ambitious candidates with verified opportunities.',
  keywords: 'jobs India, career platform, hiring, recruitment, Indian jobs',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased text-ink bg-ivory-100 selection:bg-indiaGreen-200 selection:text-indiaGreen-950">
        <AuthProvider>
          <CareerProvider>
            <SavedProvider>
              <AppWrapper>{children}</AppWrapper>
            </SavedProvider>
          </CareerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
