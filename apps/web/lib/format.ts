export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return `${count}`;
}

export function formatPrice(cents: number, currency?: string | null): string {
  const symbol = getCurrencySymbol(currency ?? 'USD');
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', BRL: 'R$',
    CAD: 'C$', AUD: 'A$', CHF: 'Fr', CNY: '¥', INR: '₹',
    KRW: '₩', MXN: 'Mex$',
  };
  return symbols[code] ?? '$';
}

export function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}...` : str;
}
