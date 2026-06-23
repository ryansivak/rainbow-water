import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Rainbow Water Hauling',
  description: 'Rainbow Water Hauling business dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#0f1117]">
        <Nav />
        <main className="max-w-[1400px] mx-auto px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
