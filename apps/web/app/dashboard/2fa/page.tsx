'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, ShieldCheck, ShieldOff, Key, Copy, Check } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { api, ApiError } from '@/lib/api/client';

export default function TwoFactorPage() {
  const { user, refreshMe } = useAuth();
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [step, setStep] = useState<'idle' | 'setup' | 'verify' | 'recovery' | 'disable'>('idle');
  const [qrCodeUri, setQrCodeUri] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const extractError = (err: unknown, fallback: string): string => {
    if (err instanceof ApiError) {
      return (err.body as Record<string, unknown>)?.message as string || err.message || fallback;
    }
    return (err as Error)?.message || fallback;
  };

  useEffect(() => {
    if (!user) return;
    api.get('/auth/session/me').then((profile: unknown) => {
      const p = profile as Record<string, unknown>;
      setTotpEnabled(!!p.totpEnabled);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const enableSetup = async () => {
    setError('');
    setMessage('');
    try {
      const res = await api.post<{ secret: string; qrCodeUri: string }>('/auth/2fa/enable');
      setQrCodeUri(res.qrCodeUri);
      setSecret(res.secret);
      setStep('verify');
    } catch (err: unknown) {
      setError(extractError(err, 'Failed to start 2FA setup'));
    }
  };

  const verifySetup = async () => {
    if (token.length !== 6) return;
    setError('');
    setMessage('');
    try {
      const res = await api.post<{ enabled: boolean; recoveryCodes: string[] }>('/auth/2fa/verify', { token });
      setRecoveryCodes(res.recoveryCodes);
      setTotpEnabled(true);
      setStep('recovery');
      setMessage('2FA enabled successfully');
      refreshMe();
    } catch (err: unknown) {
      setError(extractError(err, 'Invalid code'));
    }
  };

  const disable2fa = async () => {
    if (token.length !== 6) return;
    setError('');
    setMessage('');
    try {
      await api.post('/auth/2fa/disable', { token });
      setTotpEnabled(false);
      setStep('idle');
      setToken('');
      setMessage('2FA disabled');
      refreshMe();
    } catch (err: unknown) {
      setError(extractError(err, 'Invalid code'));
    }
  };

  const copyCodes = async () => {
    const text = recoveryCodes.join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const goToRecoveryCodes = async () => {
    setError('');
    try {
      const res = await api.get<{ recoveryCodes: string[] }>('/auth/2fa/recovery-codes');
      setRecoveryCodes(res.recoveryCodes);
      setStep('recovery');
    } catch (err: unknown) {
      setError(extractError(err, 'Failed to load recovery codes'));
    }
  };

  if (!user || loading) return null;

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl">
          <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan">
            <ArrowLeft className="size-3" /> Back to dashboard
          </Link>

          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <div className="mb-6 flex items-center gap-4">
              <div className={`grid size-14 place-items-center border ${totpEnabled ? 'border-emerald/50 bg-emerald/5 text-emerald' : 'border-border/50 bg-background/20 text-muted-foreground'}`}>
                {totpEnabled ? <ShieldCheck className="size-7" /> : <Shield className="size-7" />}
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-white">Two-Factor Authentication</h1>
                <p className="font-mono text-[0.6rem] text-muted-foreground">
                  {totpEnabled ? '2FA is enabled on your account' : 'Add an extra layer of security to your account'}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 border border-red/40 bg-red/5 p-3 font-mono text-[0.6rem] text-red">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-4 border border-emerald/40 bg-emerald/5 p-3 font-mono text-[0.6rem] text-emerald">
                {message}
              </div>
            )}

            {step === 'idle' && (
              <div className="space-y-4">
                <p className="font-mono text-[0.6rem] leading-relaxed text-muted-foreground">
                  Two-factor authentication adds an extra layer of security to your account.
                  When enabled, you&apos;ll need to enter a 6-digit code from your authentication app
                  each time you log in.
                </p>

                {totpEnabled ? (
                  <div className="space-y-3">
                    <button
                      onClick={goToRecoveryCodes}
                      className="w-full border border-cyan/50 bg-cyan/5 px-4 py-3 font-mono text-[0.65rem] uppercase tracking-wider text-cyan transition hover:bg-cyan/10"
                    >
                      <Key className="mr-2 inline size-3.5" />
                      View Recovery Codes
                    </button>
                    <button
                      onClick={() => setStep('disable')}
                      className="w-full border border-red/40 bg-red/5 px-4 py-3 font-mono text-[0.65rem] uppercase tracking-wider text-red transition hover:bg-red/10"
                    >
                      <ShieldOff className="mr-2 inline size-3.5" />
                      Disable 2FA
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={enableSetup}
                    className="w-full border border-cyan/50 bg-cyan/5 px-4 py-3 font-mono text-[0.65rem] uppercase tracking-wider text-cyan transition hover:bg-cyan/10"
                  >
                    <ShieldCheck className="mr-2 inline size-3.5" />
                    Enable 2FA
                  </button>
                )}
              </div>
            )}

            {step === 'verify' && (
              <div className="space-y-5">
                <div className="flex flex-col items-center gap-4">
                  {qrCodeUri && (
                    <div className="border border-border/50 bg-white p-3">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCodeUri)}`}
                        alt="QR Code for 2FA setup"
                        className="size-[180px]"
                      />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="font-mono text-[0.55rem] text-muted-foreground">Or enter this key manually:</p>
                    <code className="mt-1 block break-all font-mono text-[0.65rem] text-cyan">{secret}</code>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-mono text-[0.6rem] uppercase tracking-wider text-cyan">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={(e) => { if (e.key === 'Enter' && token.length === 6) verifySetup(); }}
                    className="w-full border border-border/70 bg-[#020609] px-4 py-3 font-mono text-lg tracking-[0.3em] text-white placeholder:text-muted-foreground/40 focus:border-cyan focus:outline-none"
                    autoFocus
                  />
                </div>

                <button
                  onClick={verifySetup}
                  disabled={token.length !== 6}
                  className="w-full border border-cyan/60 bg-cyan/10 px-4 py-3 font-mono text-[0.65rem] uppercase tracking-wider text-cyan transition hover:bg-cyan/20 disabled:opacity-30"
                >
                  Verify &amp; Enable
                </button>

                <button
                  onClick={() => { setStep('idle'); setToken(''); setError(''); }}
                  className="w-full border border-border/60 bg-background/20 px-4 py-3 font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            )}

            {step === 'recovery' && (
              <div className="space-y-5">
                <div className="border border-emerald/40 bg-emerald/5 p-4">
                  <p className="mb-2 font-mono text-[0.65rem] font-semibold text-emerald">Recovery Codes</p>
                  <p className="mb-4 font-mono text-[0.55rem] leading-relaxed text-muted-foreground">
                    Save these recovery codes in a safe place. Each code can be used once to sign in if you lose access to your authenticator app.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {recoveryCodes.map((code, i) => (
                      <code key={i} className="border border-border/50 bg-[#020609] px-3 py-2 font-mono text-[0.7rem] tracking-wider text-cyan">
                        {code}
                      </code>
                    ))}
                  </div>
                  <button
                    onClick={copyCodes}
                    className="mt-4 inline-flex items-center gap-2 border border-cyan/40 bg-cyan/5 px-4 py-2 font-mono text-[0.6rem] uppercase tracking-wider text-cyan transition hover:bg-cyan/10"
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copied ? 'Copied!' : 'Copy All Codes'}
                  </button>
                </div>

                <button
                  onClick={() => { setStep('idle'); setError(''); setMessage(''); }}
                  className="w-full border border-cyan/60 bg-cyan/10 px-4 py-3 font-mono text-[0.65rem] uppercase tracking-wider text-cyan transition hover:bg-cyan/20"
                >
                  Done
                </button>
              </div>
            )}

            {step === 'disable' && (
              <div className="space-y-5">
                <p className="font-mono text-[0.6rem] leading-relaxed text-muted-foreground">
                  Enter a 6-digit code from your authenticator app to disable 2FA.
                </p>

                <div>
                  <label className="mb-2 block font-mono text-[0.6rem] uppercase tracking-wider text-red">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={(e) => { if (e.key === 'Enter' && token.length === 6) disable2fa(); }}
                    className="w-full border border-border/70 bg-[#020609] px-4 py-3 font-mono text-lg tracking-[0.3em] text-white placeholder:text-muted-foreground/40 focus:border-red focus:outline-none"
                    autoFocus
                  />
                </div>

                <button
                  onClick={disable2fa}
                  disabled={token.length !== 6}
                  className="w-full border border-red/60 bg-red/10 px-4 py-3 font-mono text-[0.65rem] uppercase tracking-wider text-red transition hover:bg-red/20 disabled:opacity-30"
                >
                  Disable 2FA
                </button>

                <button
                  onClick={() => { setStep('idle'); setToken(''); setError(''); }}
                  className="w-full border border-border/60 bg-background/20 px-4 py-3 font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
