'use client';

import { useEffect, useState } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = typeof window !== 'undefined'
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')
  : null;

function CheckoutForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    const { error: submitError } = await elements.submit();
    if (submitError) { setError(submitError.message || ''); setLoading(false); return; }
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: `${window.location.origin}/me/licenses` },
      redirect: 'if_required',
    });
    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-xs text-coral">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="clip-corner inline-flex h-10 items-center gap-3 border border-cyan/70 bg-cyan px-5 font-mono text-xs text-black transition hover:bg-cyan/80 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

export function StripePayment({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!stripePromise) {
      setFailed(true);
      return;
    }
    stripePromise
      .then((resolved) => { if (!cancelled) setStripe(resolved); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  if (!stripePromise) return <p className="text-xs text-coral">Stripe not configured — set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</p>;
  if (failed) return <p className="text-xs text-coral">Stripe could not be loaded — please try again.</p>;
  if (!stripe) {
    return (
      <div role="status" aria-busy="true" aria-live="polite" className="flex items-center justify-center py-6">
        <div className="size-6 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }
  return (
    <Elements stripe={stripe} options={{ clientSecret }}>
      <CheckoutForm clientSecret={clientSecret} onSuccess={onSuccess} />
    </Elements>
  );
}
