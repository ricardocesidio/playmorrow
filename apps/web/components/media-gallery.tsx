'use client';

import { useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface MediaItem {
  id: string;
  type: string;
  url: string;
  thumbnailUrl: string | null;
  caption: string | null;
  position: number;
}

interface MediaGalleryProps {
  media: MediaItem[];
}

export function MediaGallery({ media }: MediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const screenshots = media.filter((m) => m.type === 'SCREENSHOT' || m.type === 'IMAGE');
  const trailers = media.filter((m) => m.type === 'TRAILER' || m.type === 'VIDEO');

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goNext = useCallback(() => {
    setLightboxIndex((prev) => prev !== null ? Math.min(prev + 1, screenshots.length - 1) : null);
  }, [screenshots.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) => prev !== null ? Math.max(prev - 1, 0) : null);
  }, []);

  if (media.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-semibold">Media</h2>

      {/* Trailers / Videos */}
      {trailers.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {trailers.map((m) => (
            <div key={m.id} className="group relative overflow-hidden rounded-lg border border-border bg-black">
              {m.thumbnailUrl ? (
                <img src={m.thumbnailUrl} alt={m.caption ?? ''} className="aspect-video w-full object-cover" />
              ) : (
                <img src={m.url} alt={m.caption ?? ''} className="aspect-video w-full object-cover opacity-80" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-12 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                >
                  <Play className="size-5 fill-current" />
                </a>
              </div>
              {m.caption && <p className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-xs text-white">{m.caption}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Screenshots grid */}
      {screenshots.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {screenshots.map((m, i) => (
            <button
              key={m.id}
              onClick={() => openLightbox(i)}
              className="group relative overflow-hidden rounded-lg border border-border text-left transition-colors hover:border-primary/40"
            >
              <img src={m.thumbnailUrl ?? m.url} alt={m.caption ?? ''} className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              {m.caption && (
                <p className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">{m.caption}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && screenshots[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closeLightbox}
          onKeyDown={(e) => { if (e.key === 'Escape') closeLightbox(); }}
          tabIndex={0}
        >
          <button onClick={closeLightbox} className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70">
            <X className="size-5" />
          </button>

          {lightboxIndex > 0 && (
            <button onClick={(e) => { e.stopPropagation(); goPrev(); }} className="absolute left-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70">
              <ChevronLeft className="size-6" />
            </button>
          )}

          <div onClick={(e) => e.stopPropagation()} className="flex max-h-full max-w-full flex-col items-center">
            <img src={screenshots[lightboxIndex].url} alt={screenshots[lightboxIndex].caption ?? ''} className="max-h-[85vh] max-w-full rounded object-contain" />
            {screenshots[lightboxIndex].caption && (
              <p className="mt-3 text-sm text-white/80">{screenshots[lightboxIndex].caption}</p>
            )}
            <p className="mt-1 text-xs text-white/40">{lightboxIndex + 1} / {screenshots.length}</p>
          </div>

          {lightboxIndex < screenshots.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); goNext(); }} className="absolute right-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70" style={{ top: '50%', transform: 'translateY(-50%)' }}>
              <ChevronRight className="size-6" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
