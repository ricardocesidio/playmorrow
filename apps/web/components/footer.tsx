import { Gamepad2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <Gamepad2 className="size-4 text-primary" />
          <span>Playmorrow</span>
          <span className="text-muted-foreground/50">· v0.1</span>
        </div>
        <p>Discover tomorrow&apos;s indie games today.</p>
      </div>
    </footer>
  );
}
