interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 border border-coral/40 bg-coral/[0.03] py-16 relative overflow-hidden">
      <p className="font-mono text-xs uppercase tracking-widest text-coral animate-glitch-sparse">
        <span className="inline-block size-1.5 bg-coral mr-2 shadow-[0_0_8px_rgb(255_87_77_/_0.6)]" aria-hidden />
        SIGNAL CORRUPTED
      </p>
      <p className="text-sm text-muted-foreground max-w-sm text-center">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 clip-corner border border-coral bg-coral/10 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-coral shadow-[0_0_16px_rgb(255_87_77_/_0.1)] transition hover:bg-coral hover:text-coral-foreground hover:shadow-[0_0_24px_rgb(255_87_77_/_0.2)] cursor-pointer"
        >
          RETRY CONNECTION
        </button>
      )}
    </div>
  );
}
