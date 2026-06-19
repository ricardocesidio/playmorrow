interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 border border-coral/30 bg-coral/5 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-coral">Error</p>
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 border border-coral bg-coral/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-coral transition-colors hover:bg-coral hover:text-coral-foreground"
        >
          Retry
        </button>
      )}
    </div>
  );
}
