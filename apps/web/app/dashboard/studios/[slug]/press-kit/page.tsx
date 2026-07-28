'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Save, Loader2, Upload, X, Plus, Trash2, FileText, Download, Image } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useStudio, useStudioPressKit, useSaveStudioPressKit } from '@/lib/api/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { StudioPressKit as StudioPressKitType, PressContact, PressKitDownload } from '@/lib/api/verification-types';

export default function PressKitPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { data: studio } = useStudio(slug);
  const { data: pressKit, isLoading } = useStudioPressKit(slug);
  const savePressKit = useSaveStudioPressKit();

  const [headline, setHeadline] = useState('');
  const [history, setHistory] = useState('');
  const [awards, setAwards] = useState('');
  const [pressContacts, setPressContacts] = useState<PressContact[]>([]);
  const [logoPrimary, setLogoPrimary] = useState('');
  const [logoDark, setLogoDark] = useState('');
  const [logoLight, setLogoLight] = useState('');
  const [keyArt, setKeyArt] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [downloads, setDownloads] = useState<PressKitDownload[]>([]);
  const [success, setSuccess] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (pressKit && !initialized) {
      setHeadline(pressKit.headline || '');
      setHistory(pressKit.history || '');
      setAwards(pressKit.awards || '');
      setPressContacts(pressKit.pressContacts || []);
      setLogoPrimary(pressKit.logoPrimary || '');
      setLogoDark(pressKit.logoDark || '');
      setLogoLight(pressKit.logoLight || '');
      setKeyArt(pressKit.keyArt || '');
      setTrailerUrl(pressKit.trailerUrl || '');
      setDownloads(pressKit.downloads || []);
      setInitialized(true);
    }
  }, [pressKit, initialized]);

  const addContact = () => {
    setPressContacts(prev => [...prev, { name: '', email: '', title: '' }]);
  };

  const updateContact = (index: number, key: keyof PressContact, value: string) => {
    setPressContacts(prev => prev.map((c, i) => i === index ? { ...c, [key]: value } : c));
  };

  const removeContact = (index: number) => {
    setPressContacts(prev => prev.filter((_, i) => i !== index));
  };

  const addDownload = () => {
    setDownloads(prev => [...prev, { label: '', url: '' }]);
  };

  const updateDownload = (index: number, key: keyof PressKitDownload, value: string) => {
    setDownloads(prev => prev.map((d, i) => i === index ? { ...d, [key]: value } : d));
  };

  const removeDownload = (index: number) => {
    setDownloads(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    try {
      await savePressKit.mutateAsync({
        slug,
        body: {
          headline: headline || undefined,
          history: history || undefined,
          awards: awards || undefined,
          pressContacts: pressContacts.filter(c => c.name && c.email),
          logoPrimary: logoPrimary || undefined,
          logoDark: logoDark || undefined,
          logoLight: logoLight || undefined,
          keyArt: keyArt || undefined,
          trailerUrl: trailerUrl || undefined,
          downloads: downloads.filter(d => d.label && d.url),
        },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch { console.warn("Failed to save") }
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
        <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan"><ArrowLeft className="size-3" /> Back to dashboard</Link>
            <Link href={`/studios/${slug}`} className="inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-cyan transition hover:text-white"><ExternalLink className="size-3" /> View public page</Link>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Press Kit</h1>
            <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-widest text-muted-foreground">Media resources for {studio.name}</p>
          </div>

          {success && (
            <div className="clip-corner mb-6 border border-cyan/40 bg-cyan/5 px-5 py-3 font-mono text-[0.68rem] text-cyan">Press kit saved.</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
              <div className="space-y-6">
                <Section title="Press Information" desc="Key messaging for journalists and media.">
                  <Field label="Headline">
                    <Input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="One-line description of your studio" />
                  </Field>
                  <Field label="History">
                    <textarea
                      value={history}
                      onChange={e => setHistory(e.target.value)}
                      rows={5}
                      className="clip-corner w-full resize-none border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan"
                      placeholder="Tell your studio's story..."
                    />
                  </Field>
                  <Field label="Awards & Recognition">
                    <textarea
                      value={awards}
                      onChange={e => setAwards(e.target.value)}
                      rows={3}
                      className="clip-corner w-full resize-none border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan"
                      placeholder="Notable awards, nominations, or recognition..."
                    />
                  </Field>
                </Section>

                <Section title="Press Contacts" desc="Who should journalists contact?">
                  {pressContacts.map((contact, i) => (
                    <div key={i} className="flex items-start gap-3 border border-border/60 p-3">
                      <div className="flex-1 grid gap-2 sm:grid-cols-3">
                        <Input placeholder="Name" value={contact.name} onChange={e => updateContact(i, 'name', e.target.value)} />
                        <Input placeholder="Email" type="email" value={contact.email} onChange={e => updateContact(i, 'email', e.target.value)} />
                        <Input placeholder="Title (e.g. PR Manager)" value={contact.title} onChange={e => updateContact(i, 'title', e.target.value)} />
                      </div>
                      <button type="button" onClick={() => removeContact(i)} className="mt-1 text-coral hover:text-coral/80">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addContact}>
                    <Plus className="size-3" /> Add Contact
                  </Button>
                </Section>

                <Section title="Downloads" desc="Press kit files, fact sheets, screenshots.">
                  {downloads.map((dl, i) => (
                    <div key={i} className="flex items-start gap-3 border border-border/60 p-3">
                      <div className="flex-1 grid gap-2 sm:grid-cols-2">
                        <Input placeholder="Label (e.g. Fact Sheet PDF)" value={dl.label} onChange={e => updateDownload(i, 'label', e.target.value)} />
                        <Input placeholder="URL" value={dl.url} onChange={e => updateDownload(i, 'url', e.target.value)} />
                      </div>
                      <button type="button" onClick={() => removeDownload(i)} className="mt-1 text-coral hover:text-coral/80">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addDownload}>
                    <Plus className="size-3" /> Add Download
                  </Button>
                </Section>
              </div>

              <div className="space-y-6">
                <Section title="Logos">
                  <Field label="Primary Logo">
                    <div className="flex items-center gap-2">
                      <Input value={logoPrimary} onChange={e => setLogoPrimary(e.target.value)} placeholder="Image URL" className="h-10" />
                    </div>
                    {logoPrimary && (
                      <div className="mt-2 aspect-[3/1] overflow-hidden border border-border/60 bg-background/40">
                        <img src={logoPrimary} alt="Primary logo preview" className="size-full object-contain" />
                      </div>
                    )}
                  </Field>
                  <Field label="Dark Logo (for light backgrounds)">
                    <Input value={logoDark} onChange={e => setLogoDark(e.target.value)} placeholder="Image URL" />
                    {logoDark && (
                      <div className="mt-2 aspect-[3/1] overflow-hidden border border-border/60 bg-white/90">
                        <img src={logoDark} alt="Dark logo preview" className="size-full object-contain" />
                      </div>
                    )}
                  </Field>
                  <Field label="Light Logo (for dark backgrounds)">
                    <Input value={logoLight} onChange={e => setLogoLight(e.target.value)} placeholder="Image URL" />
                    {logoLight && (
                      <div className="mt-2 aspect-[3/1] overflow-hidden border border-border/60 bg-black/60">
                        <img src={logoLight} alt="Light logo preview" className="size-full object-contain" />
                      </div>
                    )}
                  </Field>
                </Section>

                <Section title="Media">
                  <Field label="Key Art">
                    <Input value={keyArt} onChange={e => setKeyArt(e.target.value)} placeholder="Image URL" />
                    {keyArt && (
                      <div className="mt-2 aspect-video overflow-hidden border border-border/60 bg-background/40">
                        <img src={keyArt} alt="Key art preview" className="size-full object-cover" />
                      </div>
                    )}
                  </Field>
                  <Field label="Trailer URL">
                    <Input value={trailerUrl} onChange={e => setTrailerUrl(e.target.value)} placeholder="https://youtube.com/..." />
                  </Field>
                </Section>
              </div>
            </div>

            <div className="sticky bottom-0 z-10 -mx-4 border-t border-border/70 bg-[#050b0f]/95 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <Button type="submit" disabled={savePressKit.isPending}>
                  {savePressKit.isPending ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                  {savePressKit.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
