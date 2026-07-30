'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/api/auth-context';
import { toast } from 'sonner';
import { Key, Plus, Trash2, Copy, Check, Shield } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get<ApiKey[]>('/api/api-keys')
      .then(setKeys)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const create = async () => {
    if (!newName) return;
    try {
      const result = await api.post<{ key: string; name: string }>('/api/api-keys', { name: newName });
      setNewKey(result.key);
      setNewName('');
      toast.success('API key created — copy it now, you won\'t see it again');
      const updated = await api.get<ApiKey[]>('/api/api-keys');
      setKeys(updated);
    } catch { toast.error('Failed to create API key'); }
  };

  const revoke = async (id: string, name: string) => {
    try {
      await api.delete(`/api/api-keys/${id}`);
      setKeys(keys.filter(k => k.id !== id));
      toast.success(`Revoked "${name}"`);
    } catch { toast.error('Failed to revoke key'); }
  };

  const copyKey = async () => {
    if (newKey) {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-[900px] px-5 py-8 sm:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key className="size-6 text-cyan" />
          <h1 className="font-display text-2xl font-black uppercase tracking-tight text-white">API Keys</h1>
        </div>
        <button onClick={() => { setShowNew(true); setNewKey(null); }}
          className="clip-corner flex items-center gap-2 border border-cyan/50 bg-cyan/5 px-4 py-2 font-mono text-xs text-cyan hover:bg-cyan/10">
          <Plus className="size-4" /> New Key
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="size-6 animate-spin border border-cyan border-t-transparent" /></div>
      ) : keys.length === 0 && !showNew ? (
        <div className="clip-corner border border-border bg-[#09161d] p-8 text-center">
          <Key className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-2 font-mono text-sm text-muted-foreground">No API keys yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map(key => (
            <div key={key.id} className="clip-corner flex items-center justify-between border border-border bg-[#09161d] p-4">
              <div>
                <p className="font-mono text-sm font-semibold text-foreground">{key.name}</p>
                <p className="font-mono text-xs text-cyan">{key.keyPrefix}...</p>
                <p className="font-mono text-[0.5rem] text-muted-foreground">
                  Created {new Date(key.createdAt).toLocaleDateString()}
                  {key.lastUsedAt ? ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}` : ' · Never used'}
                </p>
              </div>
              <button onClick={() => revoke(key.id, key.name)}
                className="clip-corner border border-coral/30 px-3 py-1.5 font-mono text-[0.55rem] text-coral hover:bg-coral/10">
                <Trash2 className="inline size-3" /> Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New Key Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => { setShowNew(false); setNewKey(null); }}>
          <div className="mx-4 w-full max-w-md clip-corner border border-border bg-[#09161d] p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg font-black text-white">
              {newKey ? 'API Key Created' : 'Create API Key'}
            </h3>

            {newKey ? (
              <div className="mt-4">
                <p className="font-mono text-xs text-coral">Copy this key now. You won't be able to see it again.</p>
                <div className="mt-3 clip-corner flex border border-cyan/30 bg-background/80 p-3">
                  <code className="flex-1 break-all font-mono text-xs text-cyan">{newKey}</code>
                  <button onClick={copyKey} className="ml-2 text-cyan hover:text-white">
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </button>
                </div>
                <button onClick={() => { setShowNew(false); setNewKey(null); }}
                  className="mt-4 clip-corner border border-cyan/50 bg-cyan/10 px-5 py-2 font-mono text-xs text-cyan">
                  Done
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="My API Key"
                  className="clip-corner h-10 w-full border border-border bg-background/80 px-4 font-mono text-sm text-foreground outline-none"
                  onKeyDown={e => e.key === 'Enter' && create()} />
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowNew(false)}
                    className="clip-corner border border-border/60 px-5 py-2 font-mono text-xs text-muted-foreground">Cancel</button>
                  <button onClick={create} disabled={!newName}
                    className="clip-corner border border-cyan/50 bg-cyan/10 px-5 py-2 font-mono text-xs text-cyan disabled:opacity-30">
                    <Plus className="mr-1 inline size-3" /> Create Key
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
