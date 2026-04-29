export const fmt = {
  currency: (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v),
  number: (v: number) =>
    new Intl.NumberFormat('en-US').format(v),
  pct: (v: number) => `${v.toFixed(1)}%`,
  date: (s: string) => new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
  dateTime: (s: string) => new Date(s).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
};

export function clsn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export const STATUS_COLORS: Record<string, string> = {
  Draft:     'badge-gray',
  Confirmed: 'badge-blue',
  Received:  'badge-green',
  Shipped:   'badge-yellow',
  Delivered: 'badge-green',
  Cancelled: 'badge-red',
};
