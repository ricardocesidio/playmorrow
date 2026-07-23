'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api/client';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (c) => c.charCodeAt(0));
}

export function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true);
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub));
      }).catch((err) => {
        console.warn('Push: SW registration failed (will retry on next load):', err);
      });
    }
  }, []);

  const toggleSubscription = async () => {
    if (loading || !supported) return;

    if (!subscribed && Notification.permission === 'denied') {
      toast.error('Notifications blocked. Enable them in your browser site settings (lock icon in address bar → Site settings → Notifications → Allow).');
      return;
    }

    if (!subscribed && Notification.permission === 'granted') {
      // Permission already granted, proceed directly
    }

    setLoading(true);
    const timeout = setTimeout(() => {
      setLoading(false);
      if (!subscribed) toast.error('Push subscription timed out. Check your browser notification settings.');
    }, 30000);

    try {
      let registration: ServiceWorkerRegistration;
      try {
        registration = await navigator.serviceWorker.ready;
      } catch {
        toast.error('Service worker not available. Try reloading the page.');
        clearTimeout(timeout);
        setLoading(false);
        return;
      }

      if (subscribed) {
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          await api.delete('/me/push-subscriptions', { endpoint: sub.endpoint }).catch(() => {});
          await sub.unsubscribe();
        }
        setSubscribed(false);
      } else {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          toast.error('Push notifications not configured (VAPID key missing).');
          clearTimeout(timeout);
          setLoading(false);
          return;
        }
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
        });

        await api.post('/me/push-subscriptions', {
          endpoint: sub.endpoint,
          p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')!))),
        });

        setSubscribed(true);
        toast.success('Push notifications enabled!');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Push notification error';
      toast.error(msg);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <button onClick={toggleSubscription} disabled={loading} title={subscribed ? 'Disable push notifications' : 'Enable push notifications'}
      className={`flex cursor-pointer items-center gap-2 px-4 py-2 font-mono text-[0.55rem] uppercase tracking-wider transition ${
        subscribed ? 'border border-cyan bg-cyan/10 text-cyan' : 'border border-border/60 text-muted-foreground hover:border-cyan hover:text-cyan'
      }`}>
      {subscribed ? <Bell className="size-3.5" /> : <BellOff className="size-3.5" />}
      {loading ? '...' : subscribed ? 'Push On' : 'Push Off'}
    </button>
  );
}
