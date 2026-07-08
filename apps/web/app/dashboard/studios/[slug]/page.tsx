'use client';

import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Trash2, Upload, X, Loader2, Check, Camera, AlertTriangle,
  Gauge, ExternalLink, Gamepad2
} from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useStudio, useUpdateStudio, useDeleteStudio } from '@/lib/api/hooks';
import { ApiError } from '@/lib/api/client';

export default function EditStudioPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, setUser } = useAuth();
  const { data: studio, isLoading: studioLoading } = useStudio(slug);
  const updateStudio = useUpdateStudio();
  const deleteStudio = useDeleteStudio();

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [profileStrength, setProfileStrength] = useState(0);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (studio && !initialized) {
      setName(studio.name ?? ''); setTagline(studio.tagline ?? '');
      setDescription(studio.description ?? '');
      setLogoUrl(studio.logoUrl ?? ''); setBannerUrl(studio.bannerUrl ?? '');
      setLocation(studio.location ?? ''); setWebsiteUrl(studio.websiteUrl ?? '');
      setInitialized(true);
    }
  }, [studio, initialized]);

  useEffect(() => { setHasChanges(true); }, [name, tagline, description, location, websiteUrl, logoUrl, bannerUrl]);

  const autoResize = useCallback(() => {
    const ta = descRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
  }, []);

  const handleImageUpload = async (file: File, type: 'logo' | 'banner') => {
    const setter = type === 'logo' ? setLogoUrl : setBannerUrl;
    const loading = type === 'logo' ? setUploadingLogo : setUploadingBanner;
    loading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setter(reader.result);
        }
        loading(false);
        setHasChanges(true);
      };
      reader.onerror = () => loading(false);
      reader.readAsDataURL(file);
    } catch { loading(false); }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setSuccess(false);
    if (!name.trim()) { setError('Studio name is required'); return; }
    try {
      await updateStudio.mutateAsync({ slug, body: { name: name.trim(), tagline: tagline.trim() || null, description: description.trim() || null, location: location.trim() || null, websiteUrl: websiteUrl.trim() || null, logoUrl: logoUrl || null, bannerUrl: bannerUrl || null } });
      if (user && logoUrl !== undefined) {
        setUser({ ...user, avatarUrl: logoUrl || undefined });
      }
      setSuccess(true); setHasChanges(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = typeof err.body === 'object' && err.body ? (err.body as { message: string }).message || 'Failed to update' : 'Failed to update';
        setError(msg);
      } else setError('Something went wrong');
    }
  };

  const handleDelete = async () => {
    try { await deleteStudio.mutateAsync({ slug }); router.push('/dashboard'); }
    catch { setError('Failed to delete studio'); }
  };

  const descLen = description.length;
  useEffect(() => {
    const dc = Math.min(Math.ceil(description.length / 50), 14);
    setProfileStrength(Math.min(
      (name ? 14 : 0) + (tagline ? 14 : 0) + dc +
      (logoUrl ? 14 : 0) + (bannerUrl ? 14 : 0) +
      (websiteUrl ? 14 : 0) + (location ? 14 : 0),
      100
    ));
  }, [name, tagline, description, logoUrl, bannerUrl, websiteUrl, location]);

  if (authLoading || studioLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020609]">
        <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
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

  return (
    <>
      <SiteHeader />
      <div className="relative min-h-screen bg-[#020609]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

      <div className="relative mx-auto grid max-w-[1540px] lg:grid-cols-[220px_minmax(0,1fr)_320px]">
        {/* Sidebar */}
        <aside className="hidden border-r border-border/50 lg:block">
          <div className="clip-corner sticky top-0 min-h-screen border-border/90 bg-[#050b0f]/88 p-3 shadow-[0_18px_70px_rgb(0_0_0_/_0.36)]">
            <div className="border-b border-border/70 px-2 pb-3">
              <p className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-cyan"><Gauge className="size-3.5" /> Studio Dashboard</p>
            </div>
            <nav className="mt-3 space-y-1">
              {[
                { href: '/dashboard', icon: <PanelLeft className="size-4" />, label: 'Overview' },
                { href: '/dashboard/games/new', icon: <Gamepad2 className="size-4" />, label: 'My Games' },
                { href: '/dashboard/devlogs/new', icon: <FileText className="size-4" />, label: 'Devlogs' },
                { href: '/dashboard/roadmap', icon: <Workflow className="size-4" />, label: 'Roadmaps' },
                { href: '/dashboard/feed', icon: <LineChart className="size-4" />, label: 'Analytics' },
                { href: '/dashboard/notifications', icon: <Radio className="size-4" />, label: 'Community' },
                { href: `/dashboard/studios/${slug}`, icon: <Library className="size-4" />, label: 'Media Library' },
                { href: '/studios', icon: <Users className="size-4" />, label: 'Followers' },
                { href: `/dashboard/studios/${slug}/team`, icon: <ShieldCheck className="size-4" />, label: 'Team' },
                { href: `/dashboard/studios/${slug}`, icon: <Settings className="size-4" />, label: 'Settings', active: true },
              ].map((item) => (
                <Link key={item.label} href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 text-sm transition ${item.active ? 'border-r-2 border-cyan bg-cyan/10 text-foreground' : 'text-muted-foreground hover:bg-cyan/5 hover:text-foreground'}`}>
                  <span className={item.active ? 'text-cyan' : 'text-muted-foreground group-hover:text-cyan'}>{item.icon}</span>
                  <span className="flex-1 font-mono text-[0.62rem] uppercase tracking-widest">{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="mt-5 overflow-hidden border border-border/70 p-3">
              <div className="relative min-h-24">
                <img src="/demo/games/neon-warden/hero.svg" alt="" className="absolute inset-y-0 right-[-20px] h-full w-24 object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
                <div className="relative">
                  <p className="font-mono text-xs font-semibold text-violet">Need more power?</p>
                  <p className="mt-1 max-w-[130px] text-[0.68rem] text-muted-foreground">Unlock premium tools</p>
                  <span className="mt-3 inline-flex border border-coral/70 px-3 py-1.5 text-[0.68rem] text-coral">Upgrade Studio</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Editor */}
        <div className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan"><ArrowLeft className="size-3" /> Back to dashboard</Link>
            <Link href={`/studios/${slug}`} className="inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-cyan transition hover:text-white"><ExternalLink className="size-3" /> View public page</Link>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Edit Studio</h1>
            <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-widest text-muted-foreground">Manage your studio identity and preferences.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && <div className="clip-corner border border-coral/40 bg-coral/5 px-4 py-3 font-mono text-[0.68rem] text-coral">{error}</div>}
            {success && <div className="clip-corner border border-cyan/40 bg-cyan/5 px-4 py-3 font-mono text-[0.68rem] text-cyan">Studio updated successfully.</div>}

            {/* Identity */}
            <Section title="Studio Identity" desc="Basic information about your studio.">
              <Field label="Studio Name" error={!name.trim() ? 'Required' : undefined}>
                <input value={name} onChange={e => setName(e.target.value)} maxLength={40}
                  className={`clip-corner h-11 w-full border bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)] ${!name.trim() ? 'border-coral/60' : 'border-input'}`} />
              </Field>
              <Field label="Slug (immutable)">
                <input value={slug} disabled className="clip-corner h-11 w-full border border-input bg-muted/30 px-4 text-sm text-muted-foreground outline-none cursor-not-allowed" />
              </Field>
              <Field label="Tagline" hint={`${tagline.length}/120`}>
                <input value={tagline} onChange={e => setTagline(e.target.value.slice(0, 120))} maxLength={120}
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </Field>
              <Field label="Description" hint={`${descLen}/3000`}>
                <textarea ref={descRef} value={description} onChange={e => { setDescription(e.target.value.slice(0, 3000)); autoResize(); }} rows={5} maxLength={3000}
                  className="clip-corner w-full resize-none border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </Field>
            </Section>

            {/* Contact */}
            <Section title="Contact & Links" desc="How players and press can reach you.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Location">
                  <input value={location} onChange={e => setLocation(e.target.value)}
                    className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
                </Field>
                <Field label="Website">
                  <input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://..."
                    className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
                </Field>
              </div>
            </Section>

            {/* Brand Assets */}
            <Section title="Brand Assets" desc="Your studio logo and banner image.">
              <div className="grid gap-6 sm:grid-cols-2">
                <AssetUpload label="Studio Logo" value={logoUrl} uploading={uploadingLogo}
                  onUpload={f => handleImageUpload(f, 'logo')} onRemove={() => setLogoUrl('')} />
                <AssetUpload label="Studio Banner" value={bannerUrl} uploading={uploadingBanner}
                  onUpload={f => handleImageUpload(f, 'banner')} onRemove={() => setBannerUrl('')} />
              </div>
            </Section>

            {/* Danger Zone */}
            <Section title="Danger Zone" desc="Irreversible actions.">
              <div className="clip-corner border border-coral/30 bg-coral/5 p-4">
                <p className="font-mono text-xs font-semibold text-coral">Delete this studio</p>
                <p className="mt-1 text-xs text-muted-foreground">Permanently delete your studio and all associated data.</p>
                <button type="button" onClick={() => setShowDeleteModal(true)}
                  className="mt-3 cursor-pointer border border-coral/60 px-4 py-2 font-mono text-[0.62rem] uppercase tracking-widest text-coral transition hover:bg-coral/20">
                  <Trash2 className="mr-1 inline size-3" /> Delete Studio
                </button>
              </div>
            </Section>

            {/* Save Bar */}
            <div className="sticky bottom-0 z-10 -mx-4 border-t border-border/70 bg-[#050b0f]/95 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button type="submit" disabled={updateStudio.isPending || !hasChanges}
                    className="clip-corner cursor-pointer border border-cyan bg-cyan/10 px-6 py-2.5 font-mono text-[0.62rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background disabled:cursor-not-allowed disabled:opacity-40">
                    {updateStudio.isPending ? <Loader2 className="mr-1 inline size-3 animate-spin" /> : <Save className="mr-1 inline size-3" />}
                    {updateStudio.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                  <Link href="/dashboard"
                    className="border border-border/60 px-6 py-2.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan">
                    Cancel
                  </Link>
                </div>
                {hasChanges && <span className="font-mono text-[0.58rem] uppercase tracking-widest text-cyan/60 animate-pulse">● Unsaved changes</span>}
              </div>
            </div>
          </form>
        </div>

        {/* Right Preview */}
        <aside className="hidden border-l border-border/50 lg:block">
          <div className="sticky top-0 space-y-4 p-4">
            {/* Live Preview */}
            <div className="clip-corner border border-border/90 bg-[#050b0f]/88 p-4 shadow-[0_18px_70px_rgb(0_0_0_/_0.36)]">
              <p className="mb-3 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-cyan">Live Preview</p>
              <div className="aspect-[3/1] overflow-hidden border border-border/60 bg-background/60">
                {bannerUrl ? <img src={bannerUrl} alt="" className="size-full object-cover" /> : <div className="flex h-full items-center justify-center font-mono text-[0.58rem] text-muted-foreground">No banner</div>}
              </div>
              <div className="-mt-6 ml-3 flex items-end gap-3">
                <div className="size-12 border border-border/60 bg-background/80 overflow-hidden">
                  {logoUrl ? <img src={logoUrl} alt="" className="size-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><Camera className="size-4" /></div>}
                </div>
                <div className="min-w-0 pb-1">
                  <p className="truncate font-display text-sm font-bold text-white">{name || 'Studio Name'}</p>
                  <p className="truncate font-mono text-[0.58rem] text-cyan/70">@{slug}</p>
                </div>
              </div>
              {tagline && <p className="mt-3 text-[0.68rem] text-muted-foreground line-clamp-2">{tagline}</p>}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-[0.58rem] uppercase tracking-widest text-muted-foreground">
                <div><p className="font-display text-sm font-semibold text-foreground">{studio.followersCount}</p>Followers</div>
                <div><p className="font-display text-sm font-semibold text-foreground">{studio.gamesCount}</p>Games</div>
                <div><p className="font-display text-sm font-semibold text-foreground">{studio.membersCount}</p>Members</div>
              </div>
            </div>

            {/* Profile Strength */}
            <div className="clip-corner border border-border/90 bg-[#050b0f]/88 p-4 shadow-[0_18px_70px_rgb(0_0_0_/_0.36)]">
              <p className="mb-2 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-muted-foreground">Profile Strength</p>
              <div className="relative grid size-20 place-items-center mx-auto">
                <svg className="size-20 -rotate-90" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="30" fill="none" stroke="rgb(62,231,255,0.15)" strokeWidth="4" />
                  <circle cx="36" cy="36" r="30" fill="none" stroke="rgb(62,231,255)" strokeWidth="4" strokeDasharray={`${(profileStrength / 100) * 188.5} 188.5`} strokeLinecap="round" className="transition-all duration-700" />
                </svg>
                <span className="absolute font-display text-sm font-bold text-cyan">{profileStrength}%</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {[
                  { label: 'Studio Name', ok: !!name },
                  { label: 'Tagline', ok: !!tagline },
                  { label: 'Description', ok: description.length > 50 },
                  { label: 'Logo', ok: !!logoUrl },
                  { label: 'Banner', ok: !!bannerUrl },
                  { label: 'Website', ok: !!websiteUrl },
                  { label: 'Location', ok: !!location },
                ].map(item => (
                  <li key={item.label} className="flex items-center gap-2 font-mono text-[0.58rem] text-muted-foreground">
                    {item.ok ? <Check className="size-3 text-cyan" /> : <div className="size-3 rounded-full border border-border" />}
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="clip-corner w-full max-w-md border border-coral/40 bg-[#050b0f] p-6 shadow-[0_0_60px_rgb(0_0_0_/_0.5)]">
            <AlertTriangle className="mx-auto size-10 text-coral" />
            <h2 className="mt-4 text-center font-display text-lg font-bold text-foreground">Delete Studio</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">Type <strong className="text-coral">{studio.name}</strong> to confirm:</p>
            <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="Type studio name..."
              className="mt-4 w-full border border-coral/60 bg-background/80 px-4 py-3 text-sm text-foreground outline-none focus:border-coral" />
            <div className="mt-5 flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
                className="flex-1 cursor-pointer border border-border/60 px-4 py-2.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan">Cancel</button>
              <button onClick={handleDelete} disabled={deleteConfirm !== studio.name || deleteStudio.isPending}
                className="flex-1 cursor-pointer border border-coral bg-coral/10 px-4 py-2.5 font-mono text-[0.62rem] uppercase tracking-widest text-coral transition hover:bg-coral hover:text-coral-foreground disabled:cursor-not-allowed disabled:opacity-40">
                {deleteStudio.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="clip-corner border border-border/90 bg-[#050b0f]/88 p-5 shadow-[0_18px_70px_rgb(0_0_0_/_0.36)] sm:p-6">
      <div className="mb-5 border-b border-border/60 pb-3">
        <h2 className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">{title}</h2>
        <p className="mt-1 font-mono text-[0.58rem] text-muted-foreground">{desc}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children, hint, error }: { label: string; children: React.ReactNode; hint?: string; error?: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground">{label}</label>
        {hint && <span className="font-mono text-[0.55rem] text-muted-foreground/60">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1 font-mono text-[0.55rem] text-coral">{error}</p>}
    </div>
  );
}

function AssetUpload({ label, value, uploading, onUpload, onRemove }: { label: string; value: string; uploading: boolean; onUpload: (f: File) => void; onRemove: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="mb-1.5 block font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground">{label}</label>
      <div className="clip-corner relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center border border-dashed border-border/70 bg-background/40 transition hover:border-cyan/50"
        onClick={() => inputRef.current?.click()}>
        {value ? (
          <div className="relative size-full">
            <img src={value} alt="" className="max-h-[140px] w-full object-contain" />
            <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }}
              className="absolute right-2 top-2 cursor-pointer border border-coral/60 bg-background/80 p-1.5 text-coral transition hover:bg-coral/20">
              <X className="size-3" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8">
            {uploading ? <Loader2 className="size-6 animate-spin text-cyan" /> : <Upload className="size-6 text-muted-foreground" />}
            <p className="font-mono text-[0.58rem] text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload'}</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }} />
      </div>
    </div>
  );
}
