import './globals.css';

export const metadata = {
  title: 'ADBSnap Studio - Automated Mobile Mockups',
  description: 'Automated mobile screenshot capture and App Store / Google Play marketing asset studio.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0b0e] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
