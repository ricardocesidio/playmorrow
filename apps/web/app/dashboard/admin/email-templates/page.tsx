'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/api/auth-context';
import { toast } from 'sonner';
import {
  Mail, Plus, Pencil, Eye, Code, Shield, RefreshCw, Check, X,
} from 'lucide-react';

interface Template {
  id: string;
  slug: string;
  name: string;
  subject: string;
  category: string;
  variables: string[];
  createdAt: string;
}

export default function EmailTemplatesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');

  // Form state
  const [formSlug, setFormSlug] = useState('');
  const [formName, setFormName] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formCategory, setFormCategory] = useState('transactional');
  const [formVars, setFormVars] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    api.get<{ items: Template[]; total: number }>('/api/admin/email-templates')
      .then(data => setTemplates(data.items || []))
      .catch(() => toast.error('Failed to load templates'))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const openNew = () => {
    setEditing(null);
    setFormSlug(''); setFormName(''); setFormSubject('');
    setFormBody(''); setFormCategory('transactional'); setFormVars('');
    setShowEditor(true);
  };

  const openEdit = (tmpl: Template) => {
    setEditing(tmpl);
    setFormSlug(tmpl.slug); setFormName(tmpl.name);
    setFormSubject(tmpl.subject); setFormCategory(tmpl.category);
    setFormVars(tmpl.variables.join(', '));
    // Fetch full template body
    api.get<{ id: string; bodyHtml: string }>(`/api/admin/email-templates/${tmpl.slug}`)
      .then(d => setFormBody(d.bodyHtml))
      .catch(() => setFormBody(''));
    setShowEditor(true);
  };

  const save = async () => {
    const variables = formVars.split(',').map(v => v.trim()).filter(Boolean);
    try {
      if (editing) {
        await api.patch(`/api/admin/email-templates/${editing.id}`, {
          name: formName, subject: formSubject, bodyHtml: formBody, variables,
        });
        toast.success('Template updated');
      } else {
        await api.post('/api/admin/email-templates', {
          slug: formSlug, name: formName, subject: formSubject,
          bodyHtml: formBody, variables, category: formCategory,
        });
        toast.success('Template created');
      }
      setShowEditor(false);
      setEditing(null);
      // Refresh list
      api.get<{ items: Template[] }>('/api/admin/email-templates')
        .then(data => setTemplates(data.items || []))
        .catch(() => {});
    } catch { toast.error('Failed to save template'); }
  };

  const preview = async () => {
    // Simple variable replacement for preview
    const sampleVars: Record<string, string> = {
      username: 'player123', siteUrl: 'https://playmorrow.vercel.app',
      verifyUrl: 'https://playmorrow.vercel.app/verify?token=abc',
      resetUrl: 'https://playmorrow.vercel.app/reset?token=abc',
      studioName: 'Awesome Studio', devlogTitle: 'New Update!',
      devlogUrl: 'https://playmorrow.vercel.app/devlogs/abc',
      gameTitle: 'Epic Game', gameUrl: 'https://playmorrow.vercel.app/games/epic',
      date: new Date().toLocaleDateString(), activityCount: '12',
    };
    let html = formBody;
    let subject = formSubject;
    for (const [key, val] of Object.entries(sampleVars)) {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), val);
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), val);
    }
    setPreviewSubject(subject);
    setPreviewHtml(html);
    setShowPreview(true);
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-12">
        <div className="clip-corner border border-coral/50 bg-coral/5 p-6 text-center">
          <Shield className="mx-auto size-10 text-coral" />
          <h1 className="mt-4 font-display text-xl font-black text-white">Access Denied</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="size-6 text-cyan" />
          <h1 className="font-display text-2xl font-black uppercase tracking-tight text-white">Email Templates</h1>
        </div>
        <button onClick={openNew}
          className="clip-corner flex items-center gap-2 border border-cyan/50 bg-cyan/5 px-4 py-2 font-mono text-xs text-cyan hover:bg-cyan/10">
          <Plus className="size-4" /> New Template
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="size-6 animate-spin border border-cyan border-t-transparent" />
        </div>
      ) : templates.length === 0 ? (
        <div className="clip-corner border border-border bg-[#09161d] p-8 text-center">
          <Mail className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-2 font-mono text-sm text-muted-foreground">No email templates yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map(tmpl => (
            <div key={tmpl.id} className="clip-corner border border-border bg-[#09161d] p-5 transition hover:border-cyan/30">
              <div className="flex items-center justify-between">
                <span className={`clip-corner px-2 py-0.5 font-mono text-[0.5rem] uppercase tracking-wider ${
                  tmpl.category === 'transactional' ? 'bg-cyan/10 text-cyan border border-cyan/30'
                  : tmpl.category === 'digest' ? 'bg-amber/10 text-amber border border-amber/30'
                  : 'bg-violet/10 text-violet border border-violet/30'
                }`}>{tmpl.category}</span>
                <button onClick={() => openEdit(tmpl)} className="text-muted-foreground hover:text-cyan">
                  <Pencil className="size-4" />
                </button>
              </div>
              <h3 className="mt-2 font-display text-base font-bold text-white">{tmpl.name}</h3>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{tmpl.slug}</p>
              <p className="mt-2 font-mono text-[0.55rem] text-muted-foreground/60">{tmpl.subject}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {tmpl.variables.map(v => (
                  <span key={v} className="clip-corner bg-cyan/5 px-2 py-0.5 font-mono text-[0.45rem] text-cyan/70">
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-12">
          <div className="w-full max-w-3xl clip-corner border border-border bg-[#09161d]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border/60 p-5">
              <h2 className="font-display text-lg font-black text-white">{editing ? 'Edit Template' : 'New Template'}</h2>
              <button onClick={() => setShowEditor(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Slug</label>
                  <input value={formSlug} onChange={e => setFormSlug(e.target.value)} placeholder="welcome-email"
                    disabled={!!editing}
                    className="mt-1 clip-corner h-10 w-full border border-border bg-background/80 px-3 font-mono text-sm text-foreground outline-none disabled:opacity-50" />
                </div>
                <div>
                  <label className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Name</label>
                  <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Welcome Email"
                    className="mt-1 clip-corner h-10 w-full border border-border bg-background/80 px-3 font-mono text-sm text-foreground outline-none" />
                </div>
              </div>
              <div>
                <label className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Subject</label>
                <input value={formSubject} onChange={e => setFormSubject(e.target.value)} placeholder="Welcome to {{siteName}}!"
                  className="mt-1 clip-corner h-10 w-full border border-border bg-background/80 px-3 font-mono text-sm text-foreground outline-none" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Category</label>
                  <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
                    className="mt-1 clip-corner h-10 w-full border border-border bg-background/80 px-3 font-mono text-sm text-foreground outline-none">
                    <option value="transactional">Transactional</option>
                    <option value="notification">Notification</option>
                    <option value="digest">Digest</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Variables (comma-separated)</label>
                  <input value={formVars} onChange={e => setFormVars(e.target.value)} placeholder="username, siteUrl"
                    className="mt-1 clip-corner h-10 w-full border border-border bg-background/80 px-3 font-mono text-sm text-foreground outline-none" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">HTML Body</label>
                  <button onClick={preview}
                    className="flex items-center gap-1 font-mono text-[0.55rem] text-cyan hover:text-white">
                    <Eye className="size-3" /> Preview
                  </button>
                </div>
                <textarea value={formBody} onChange={e => setFormBody(e.target.value)} rows={16}
                  className="mt-1 clip-corner w-full border border-border bg-background/80 p-3 font-mono text-xs text-foreground outline-none"
                  placeholder="<div>HTML content with {{variables}}</div>" />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-border/60 p-5">
              <button onClick={() => setShowEditor(false)}
                className="clip-corner border border-border/60 px-5 py-2 font-mono text-xs text-muted-foreground">
                Cancel
              </button>
              <button onClick={save} disabled={!formName || !formSubject || !formBody}
                className="clip-corner border border-cyan/50 bg-cyan/10 px-5 py-2 font-mono text-xs text-cyan hover:bg-cyan/20 disabled:opacity-30">
                <Check className="mr-1 inline size-3" /> Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-12" onClick={() => setShowPreview(false)}>
          <div className="w-full max-w-2xl clip-corner border border-border bg-white" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <p className="font-mono text-xs font-semibold text-gray-800">Subject: {previewSubject}</p>
              </div>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>
            <iframe className="h-[500px] w-full" srcDoc={previewHtml} title="Email Preview" />
          </div>
        </div>
      )}
    </div>
  );
}
