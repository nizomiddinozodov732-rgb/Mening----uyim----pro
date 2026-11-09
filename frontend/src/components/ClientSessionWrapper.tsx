'use client';

import { useEffect, useRef } from 'react';
import { useStore, api } from '@/store/useStore';

export default function ClientSessionWrapper({ children }: { children: React.ReactNode }) {
  const { setToken, setUser, logout, user } = useStore();
  const fetched = useRef(false);

  useEffect(() => {
    // Faqat bir marta fetch qilish — re-renderda qayta chaqirmaslik
    if (fetched.current || user) return;
    fetched.current = true;

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    setToken(token);
    api.get('/auth/profile/')
      .then(res => setUser(res.data))
      .catch(() => logout());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
