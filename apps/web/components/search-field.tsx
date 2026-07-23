import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (e: React.FormEvent) => void;
  placeholder?: string;
}

export function SearchField({ value, onChange, onSubmit, placeholder = 'Search...' }: SearchFieldProps) {
  return (
    <form onSubmit={onSubmit} className="relative" role="search">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="bg-elevated py-2.5 pl-10 pr-4 font-mono text-xs uppercase tracking-widest placeholder:text-muted-foreground/40 shadow-[0_0_16px_rgb(62_231_255_/_0.2)] caret-cyan"
      />
    </form>
  );
}
