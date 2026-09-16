import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ADBSnap Studio — Automated Mobile Mockups',
  description: 'Automated mobile screenshot capture and App Store / Google Play marketing asset studio.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0b0e] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
