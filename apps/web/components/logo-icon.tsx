export { PlaymorrowLogo } from '@/components/brand/logo';

interface LogoIconProps {
  className?: string;
}

export function LogoIcon({ className }: LogoIconProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5 4h21.2L35 12.8v7.1L25.4 29.5H13.2V36H5V22.5h17l5.3-5.3v-1.7L22 10.2H5V4Z"
        fill="currentColor"
      />
    </svg>
  );
}
