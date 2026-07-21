import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgryX Studio OS',
  description: 'Reputation, quotes, CRM, and delivery — all in one place for photography studios.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
