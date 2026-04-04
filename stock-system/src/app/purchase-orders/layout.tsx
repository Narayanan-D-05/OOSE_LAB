'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/app/dashboard/layout';

export default function POLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!isLoading && !user) router.replace('/login'); }, [user, isLoading, router]);
  if (isLoading || !user) return null;
  return <DashboardLayout>{children}</DashboardLayout>;
}
