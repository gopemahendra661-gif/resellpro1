import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ResellPro – Meesho Product Extractor',
  description: 'Extract & resell Meesho products with auto-margin',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
