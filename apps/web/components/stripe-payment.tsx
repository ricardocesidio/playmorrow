'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
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
        className="clip-corner inline-flex h-10 items-center gap-3 border border-cyan/70 bg-cyan px-5 font-mono text-xs text-white transition hover:bg-cyan/80 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

export function StripePayment({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  if (!stripePromise) return <p className="text-xs text-coral">Stripe not configured — set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</p>;
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm clientSecret={clientSecret} onSuccess={onSuccess} />
    </Elements>
  );
}
