import React from 'react';
import '../globals.css';
import AuthProvider from '@/app/Component/Auth/AuthProvider';
import ClientLayout from './ClientLayout';

export const metadata = {
  title: 'Saffron Edge',
  description: 'Saffron Edge is a leading digital marketing agency that specializes in providing innovative and effective marketing solutions to businesses of all sizes.',
};

export default function DashboardLayout({ children }) {
  return (
    <AuthProvider>
      <div className="min-h-screen lg:bg-[#FFF8F3] bg-[#121212] lg:text-slate-900 text-white">
        <ClientLayout>{children}</ClientLayout>
      </div>
    </AuthProvider>
  );
}
