'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Save, Loader2, Building2 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useStudio, useCompanyProfile, useUpdateCompanyProfile } from '@/lib/api/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { COMPANY_SIZE_OPTIONS } from '@/lib/api/verification-types';
import type { CompanyProfile as CompanyProfileType } from '@/lib/api/verification-types';

export default function CompanyProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { data: studio } = useStudio(slug);
  const { data: profile, isLoading } = useCompanyProfile(slug);
  const updateProfile = useUpdateCompanyProfile();

  const [form, setForm] = useState<CompanyProfileType>({});
  const [initialized, setInitialized] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile && !initialized) {
      setForm({
        legalName: profile.legalName || '',
        businessEmail: profile.businessEmail || '',
        supportEmail: profile.supportEmail || '',
        pressContact: profile.pressContact || '',
        country: profile.country || '',
        city: profile.city || '',
        foundedDate: profile.foundedDate || '',
        companySize: profile.companySize || '',
        discord: profile.discord || '',
        xUrl: profile.xUrl || '',
        githubUrl: profile.githubUrl || '',
        linkedinUrl: profile.linkedinUrl || '',
        steamUrl: profile.steamUrl || '',
        epicUrl: profile.epicUrl || '',
        itchUrl: profile.itchUrl || '',
        engine: profile.engine || '',
        platforms: profile.platforms || '',
        mission: profile.mission || '',
        vision: profile.vision || '',
        businessDescription: profile.businessDescription || '',
      });
      setInitialized(true);
    }
  }, [profile, initialized]);

  const update = (key: keyof CompanyProfileType, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    try {
      await updateProfile.mutateAsync({ slug, body: form });
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

  const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div>
      <label className="mb-1.5 flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        {hint && <span className="text-[0.55rem]">{hint}</span>}
      </label>
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
              <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Company Profile</h1>
              <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-widest text-muted-foreground">Legal and business information for {studio.name}</p>
            </div>
            <Building2 className="size-8 text-cyan/30" />
          </div>

          {success && (
            <div className="clip-corner mb-6 border border-cyan/40 bg-cyan/5 px-5 py-3 font-mono text-[0.68rem] text-cyan">Company profile saved.</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Section title="Legal Information" desc="Official business details for verification and legal purposes.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Legal Company Name">
                  <Input value={form.legalName || ''} onChange={e => update('legalName', e.target.value)} placeholder="e.g. Playmorrow Inc." />
                </Field>
                <Field label="Company Size">
                  <select
                    value={form.companySize || ''}
                    onChange={e => update('companySize', e.target.value)}
                    className="clip-corner h-12 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan"
                  >
                    <option value="">Select size</option>
                    {COMPANY_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s} employees</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Country">
                  <Input value={form.country || ''} onChange={e => update('country', e.target.value)} placeholder="e.g. Sweden" />
                </Field>
                <Field label="City">
                  <Input value={form.city || ''} onChange={e => update('city', e.target.value)} placeholder="e.g. Stockholm" />
                </Field>
                <Field label="Founded Date">
                  <Input type="date" value={form.foundedDate || ''} onChange={e => update('foundedDate', e.target.value)} />
                </Field>
              </div>
            </Section>

            <Section title="Contact Information" desc="Email addresses for different purposes.">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Business Email">
                  <Input type="email" value={form.businessEmail || ''} onChange={e => update('businessEmail', e.target.value)} placeholder="business@studio.com" />
                </Field>
                <Field label="Support Email">
                  <Input type="email" value={form.supportEmail || ''} onChange={e => update('supportEmail', e.target.value)} placeholder="support@studio.com" />
                </Field>
                <Field label="Press Contact">
                  <Input type="email" value={form.pressContact || ''} onChange={e => update('pressContact', e.target.value)} placeholder="press@studio.com" />
                </Field>
              </div>
            </Section>

            <Section title="Social Links" desc="Connect your studio's social presence.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Discord">
                  <Input value={form.discord || ''} onChange={e => update('discord', e.target.value)} placeholder="https://discord.gg/..." />
                </Field>
                <Field label="X (Twitter)">
                  <Input value={form.xUrl || ''} onChange={e => update('xUrl', e.target.value)} placeholder="https://x.com/..." />
                </Field>
                <Field label="GitHub">
                  <Input value={form.githubUrl || ''} onChange={e => update('githubUrl', e.target.value)} placeholder="https://github.com/..." />
                </Field>
                <Field label="LinkedIn">
                  <Input value={form.linkedinUrl || ''} onChange={e => update('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/company/..." />
                </Field>
              </div>
            </Section>

            <Section title="Platform Links" desc="Your games on distribution platforms.">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Steam">
                  <Input value={form.steamUrl || ''} onChange={e => update('steamUrl', e.target.value)} placeholder="https://store.steampowered.com/..." />
                </Field>
                <Field label="Epic Games">
                  <Input value={form.epicUrl || ''} onChange={e => update('epicUrl', e.target.value)} placeholder="https://store.epicgames.com/..." />
                </Field>
                <Field label="itch.io">
                  <Input value={form.itchUrl || ''} onChange={e => update('itchUrl', e.target.value)} placeholder="https://studio.itch.io/..." />
                </Field>
              </div>
            </Section>

            <Section title="Development" desc="Tech stack information.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Engine(s)">
                  <Input value={form.engine || ''} onChange={e => update('engine', e.target.value)} placeholder="e.g. Unity, Unreal Engine, Godot" />
                </Field>
                <Field label="Platform(s)">
                  <Input value={form.platforms || ''} onChange={e => update('platforms', e.target.value)} placeholder="e.g. PC, Console, Mobile" />
                </Field>
              </div>
            </Section>

            <Section title="About the Studio" desc="Your studio's mission, vision, and description.">
              <Field label="Mission">
                <textarea
                  value={form.mission || ''}
                  onChange={e => update('mission', e.target.value)}
                  rows={3}
                  className="clip-corner w-full resize-none border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan"
                  placeholder="What drives your studio?"
                />
              </Field>
              <Field label="Vision">
                <textarea
                  value={form.vision || ''}
                  onChange={e => update('vision', e.target.value)}
                  rows={3}
                  className="clip-corner w-full resize-none border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan"
                  placeholder="What do you aspire to achieve?"
                />
              </Field>
              <Field label="Business Description">
                <textarea
                  value={form.businessDescription || ''}
                  onChange={e => update('businessDescription', e.target.value)}
                  rows={4}
                  className="clip-corner w-full resize-none border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan"
                  placeholder="Describe your studio's business and operations."
                />
              </Field>
            </Section>

            <div className="sticky bottom-0 z-10 -mx-4 border-t border-border/70 bg-[#050b0f]/95 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                  {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
