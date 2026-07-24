import type { CSSProperties } from 'react';

interface PlaymorrowLogoProps {
  className?: string;
  style?: CSSProperties;
  cutout?: boolean;
  showText?: boolean;
  size?: number;
}

export function PlaymorrowLogo({ className = '', style, cutout = false, showText = false, size = 28 }: PlaymorrowLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 sm:gap-4 ${className}`} style={style} aria-label="PLAYMORROW">
      <span className="relative block shrink-0" style={{ width: size, height: size, color: 'inherit', filter: 'inherit' }}>
        <svg viewBox="0 0 40 40" aria-hidden className="size-full">
          <path fill="currentColor" d="M5 4h21.2L35 12.8v7.1L25.4 29.5H13.2V36H5V22.5h17l5.3-5.3v-1.7L22 10.2H5V4Z" />
          {cutout && <path fill="transparent" d="M5 14.2h14.5l3.5 3.5-3.5 3.5H5v-7Z" />}
        </svg>
      </span>
      {showText && (
        <span className="font-mono text-[0.95rem] font-semibold uppercase tracking-[0.3em] text-[#eef2f2] [text-shadow:0_0_12px_rgb(255_255_255_/_0.14)] sm:text-[1.05rem] sm:tracking-[0.42em]">
          PLAYMORROW
        </span>
      )}
    </span>
  );
}
