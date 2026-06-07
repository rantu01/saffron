import React from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css';
import AuthProvider from '@/app/Component/Auth/AuthProvider';
import ClientLayout from './ClientLayout';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Saffron Edge',
  description: 'Saffron Edge is a leading digital marketing agency that specializes in providing innovative and effective marketing solutions to businesses of all sizes.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <div className="min-h-screen lg:bg-[#FFF8F3] bg-[#121212] lg:text-slate-900 text-white">
            <ClientLayout>{children}</ClientLayout>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}