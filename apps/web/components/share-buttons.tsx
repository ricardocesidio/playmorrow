'use client';

import { useState } from 'react';
import { Check, LinkIcon, Share2 } from 'lucide-react';
import { X, Facebook, Disc3 } from 'lucide-react';

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState<'link' | 'discord' | null>(null);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async (type: 'link' | 'discord') => {
    if (navigator?.clipboard && shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(type);
      window.setTimeout(() => setCopied(null), 1600);
    }
  };

  return (
    <div className="mt-3">
      <p className="pm-micro text-muted-foreground">Share</p>
      <div className="mt-2 grid grid-cols-5 justify-items-center gap-2">
        <button type="button" onClick={() => copyLink('link')} aria-label="Copy link" className="cursor-pointer grid size-8 place-items-center border border-border bg-background/55 text-muted-foreground hover:text-cyan">
          {copied === 'link' ? <Check className="size-4 text-success" /> : <LinkIcon className="size-4" />}
        </button>
        <a aria-label="Share on X" href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer grid size-8 place-items-center border border-border bg-background/55 text-muted-foreground hover:text-cyan"><X className="size-4" /></a>
        <a aria-label="Share on Facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer grid size-8 place-items-center border border-border bg-background/55 text-muted-foreground hover:text-cyan"><Facebook className="size-4" /></a>
        <a aria-label="Share on Reddit" href={`https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer grid size-8 place-items-center border border-border bg-background/55 text-muted-foreground hover:text-cyan"><Disc3 className="size-4" /></a>
        <button type="button" aria-label="Copy Discord share link" onClick={() => copyLink('discord')} className="cursor-pointer grid size-8 place-items-center border border-border bg-background/55 text-muted-foreground hover:text-cyan">
          {copied === 'discord' ? <Check className="size-4 text-success" /> : <Share2 className="size-4" />}
        </button>
      </div>
    </div>
  );
}
