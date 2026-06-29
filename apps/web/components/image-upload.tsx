'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { API } from '@/lib/api/client';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
}

export function ImageUpload({ value, onChange, label = 'Image', accept = 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    if (file.size > 5 * 1024 * 1024) { setError('Image too large. Max 5MB.'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
      setUploading(false);
    };
    reader.onerror = () => { setError('Failed to read file'); setUploading(false); };
    reader.readAsDataURL(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="URL or upload a file"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            title="Upload file"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFile}
            className="hidden"
          />
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="rounded-md p-1.5 text-muted-foreground hover:text-destructive transition-colors"
            title="Clear"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {value && (
        <div className="overflow-hidden rounded-lg border border-border">
          <img
            src={value.startsWith('http') ? value : `${API}${value.startsWith('/') ? '' : '/'}${value}`}
            alt="Preview"
            className="max-h-40 w-full object-contain bg-muted/30"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
