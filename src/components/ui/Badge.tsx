import { STATUS_COLORS } from '../../utils/format';

interface BadgeProps {
  status: string;
}

export function StatusBadge({ status }: BadgeProps) {
  const cls = STATUS_COLORS[status] ?? 'badge-gray';
  return <span className={`badge ${cls}`}>{status}</span>;
}

interface StockBadgeProps {
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}
export function StockBadge({ status }: StockBadgeProps) {
  const cls = status === 'In Stock' ? 'badge-green' : status === 'Low Stock' ? 'badge-yellow' : 'badge-red';
  return <span className={`badge ${cls}`}>{status}</span>;
}
