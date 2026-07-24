'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Save, Loader2, Plus, Trash2, Palette } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useStudio, useStudioBrandKit, useSaveStudioBrandKit } from '@/lib/api/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BrandKit as BrandKitType } from '@/lib/api/verification-types';

export default function BrandKitPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { data: studio } = useStudio(slug);
  const { data: brandKit, isLoading } = useStudioBrandKit(slug);
  const saveBrandKit = useSaveStudioBrandKit();

  const [logoPrimary, setLogoPrimary] = useState('');
  const [logoDark, setLogoDark] = useState('');
  const [logoLight, setLogoLight] = useState('');
  const [colors, setColors] = useState<string[]>(['']);
  const [typography, setTypography] = useState('');
  const [brandRules, setBrandRules] = useState('');
  const [success, setSuccess] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (brandKit && !initialized) {
      setLogoPrimary(brandKit.logoPrimary || '');
      setLogoDark(brandKit.logoDark || '');
      setLogoLight(brandKit.logoLight || '');
      setColors(brandKit.colors && brandKit.colors.length ? brandKit.colors : ['']);
      setTypography(brandKit.typography || '');
      setBrandRules(brandKit.brandRules || '');
      setInitialized(true);
    }
  }, [brandKit, initialized]);

  const addColor = () => {
    setColors(prev => [...prev, '']);
  };

  const updateColor = (index: number, value: string) => {
    setColors(prev => prev.map((c, i) => i === index ? value : c));
  };

  const removeColor = (index: number) => {
    setColors(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    try {
      await saveBrandKit.mutateAsync({
        slug,
        body: {
          logoPrimary: logoPrimary || undefined,
          logoDark: logoDark || undefined,
          logoLight: logoLight || undefined,
          colors: colors.filter(c => c.trim()),
          typography: typography || undefined,
          brandRules: brandRules || undefined,
        },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch { console.warn("error") }
  };

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <div className="flex min-h-screen items-center justify-center bg-[#020609]">
          <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
        </div>
      </>
    );
  }

  if (!studio) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#020609] px-4">
        <p className="font-display text-2xl font-semibold text-foreground">Studio not found</p>
        <Link href="/dashboard" className="mt-4 font-mono text-xs uppercase tracking-widest text-cyan underline">Back to dashboard</Link>
      </div>
    );
  }

  const Section = ({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) => (
    <fieldset className="clip-corner border border-border/90 bg-[#050b0f]/86 p-6 shadow-[0_18px_70px_rgb(0_0_0_/_0.36)]">
      <legend className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">{title}</legend>
      {desc && <p className="mb-5 mt-1 text-xs text-muted-foreground">{desc}</p>}
      <div className="space-y-4">{children}</div>
    </fieldset>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="mb-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground">{label}</label>
      {children}
    </div>
  );

  return (
    <>
      <SiteHeader />
      <div className="relative min-h-screen bg-[#020609]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan"><ArrowLeft className="size-3" /> Back to dashboard</Link>
            <Link href={`/studios/${slug}`} className="inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-cyan transition hover:text-white"><ExternalLink className="size-3" /> View public page</Link>
          </div>

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Brand Kit</h1>
              <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-widest text-muted-foreground">Visual identity for {studio.name}</p>
            </div>
            <Palette className="size-8 text-cyan/30" />
          </div>

          {success && (
            <div className="clip-corner mb-6 border border-cyan/40 bg-cyan/5 px-5 py-3 font-mono text-[0.68rem] text-cyan">Brand kit saved.</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Section title="Logos" desc="Your studio's logo in different variants.">
              <Field label="Primary Logo">
                <Input value={logoPrimary} onChange={e => setLogoPrimary(e.target.value)} placeholder="Image URL" />
                {logoPrimary && (
                  <div className="mt-2 aspect-[3/1] overflow-hidden border border-border/60 bg-background/40">
                    <img src={logoPrimary} alt="" className="size-full object-contain" />
                  </div>
                )}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Dark Logo (light backgrounds)">
                  <Input value={logoDark} onChange={e => setLogoDark(e.target.value)} placeholder="Image URL" />
                  {logoDark && (
                    <div className="mt-2 aspect-[3/1] overflow-hidden border border-border/60 bg-white/90">
                      <img src={logoDark} alt="" className="size-full object-contain" />
                    </div>
                  )}
                </Field>
                <Field label="Light Logo (dark backgrounds)">
                  <Input value={logoLight} onChange={e => setLogoLight(e.target.value)} placeholder="Image URL" />
                  {logoLight && (
                    <div className="mt-2 aspect-[3/1] overflow-hidden border border-border/60 bg-black/60">
                      <img src={logoLight} alt="" className="size-full object-contain" />
                    </div>
                  )}
                </Field>
              </div>
            </Section>

            <Section title="Brand Colors" desc="Your brand's color palette.">
              {colors.map((color, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="color"
                      value={color || '#000000'}
                      onChange={e => updateColor(i, e.target.value)}
                      className="size-10 cursor-pointer border border-border/60 bg-transparent"
                    />
                    <Input
                      value={color}
                      onChange={e => updateColor(i, e.target.value)}
                      placeholder="#hex or color name"
                      className="h-10"
                    />
                  </div>
                  {colors.length > 1 && (
                    <button type="button" onClick={() => removeColor(i)} className="text-coral hover:text-coral/80">
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addColor}>
                <Plus className="size-3" /> Add Color
              </Button>
              {colors.filter(c => c.trim()).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {colors.filter(c => c.trim()).map((c, i) => (
                    <div key={i} className="flex items-center gap-2 border border-border/60 px-3 py-1.5">
                      <span className="size-4 border border-border/40" style={{ backgroundColor: c }} />
                      <span className="font-mono text-[0.55rem] text-muted-foreground">{c}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Typography" desc="Fonts and typeface guidelines.">
              <Field label="Primary Typeface">
                <Input value={typography} onChange={e => setTypography(e.target.value)} placeholder="e.g. Inter, system-ui, sans-serif" />
              </Field>
            </Section>

            <Section title="Brand Rules" desc="Guidelines for using your brand assets.">
              <textarea
                value={brandRules}
                onChange={e => setBrandRules(e.target.value)}
                rows={8}
                className="clip-corner w-full resize-none border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan"
                placeholder="Describe how your brand assets should be used — spacing, clear space, do's and don'ts, etc."
              />
            </Section>

            <div className="sticky bottom-0 z-10 -mx-4 border-t border-border/70 bg-[#050b0f]/95 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <Button type="submit" disabled={saveBrandKit.isPending}>
                  {saveBrandKit.isPending ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                  {saveBrandKit.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
