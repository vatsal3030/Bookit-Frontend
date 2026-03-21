import { cn } from '../../lib/utils';

const statusStyles: Record<string, string> = {
  PENDING: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
  CONFIRMED: 'border-green-500/40 bg-green-500/10 text-green-400',
  COMPLETED: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  CANCELLED: 'border-red-500/40 bg-red-500/10 text-red-400',
  NO_SHOW: 'border-gray-500/40 bg-gray-500/10 text-gray-400',
  SUCCESS: 'border-green-500/40 bg-green-500/10 text-green-400',
  FAILED: 'border-red-500/40 bg-red-500/10 text-red-400',
  REFUNDED: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
  CUSTOMER: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  PROVIDER: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
  ADMIN: 'border-red-500/40 bg-red-500/10 text-red-400',
};

interface BadgeProps {
  status: string;
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border',
      statusStyles[status] || 'border-gray-500/40 bg-gray-500/10 text-gray-400',
      className
    )}>
      {status}
    </span>
  );
}
