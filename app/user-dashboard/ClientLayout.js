'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/Component/Auth/AuthProvider';
import UserSidebar from './components/Sidebar';
import UserTopbar from './components/Topbar';

export default function ClientLayout({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/');
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return <div className='min-h-screen bg-[#FFF8F3]' />;
  }

  return (
    <>
      <UserSidebar open={open} onClose={() => setOpen(false)} />
      <div className='min-h-screen lg:pl-64'>
        <UserTopbar onToggle={() => setOpen((v) => !v)} />
        <main className='px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
          <div className='mx-auto w-full max-w-7xl'>{children}</div>
        </main>
      </div>
    </>
  );
}
