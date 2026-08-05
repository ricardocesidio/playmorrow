'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LicensesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/me/licenses'); }, [router]);
  return null;
}
