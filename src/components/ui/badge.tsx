import { cn } from "../../lib/utils"

type Status = string;

const statusMap: Record<string, string> = {
  PENDING:   "bg-yellow-50 text-yellow-700 border border-yellow-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border border-blue-200",
  COMPLETED: "bg-green-50 text-green-700 border border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border border-red-200",
  NO_SHOW:   "bg-gray-100 text-gray-600 border border-gray-200",
  SUCCESS:   "bg-green-50 text-green-700 border border-green-200",
  FAILED:    "bg-red-50 text-red-700 border border-red-200",
  REFUNDED:  "bg-purple-50 text-purple-700 border border-purple-200",
  PAYLATER:  "bg-orange-50 text-orange-700 border border-orange-200",
};

const dotMap: Record<string, string> = {
  PENDING:   "bg-yellow-500",
  CONFIRMED: "bg-blue-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-500",
  NO_SHOW:   "bg-gray-400",
  SUCCESS:   "bg-green-500",
  FAILED:    "bg-red-500",
  REFUNDED:  "bg-purple-500",
};

export function Badge({ status, className }: { status: Status; className?: string }) {
  const key = (status || '').toUpperCase();
  const style = statusMap[key] || "bg-gray-100 text-gray-600 border border-gray-200";
  const dot = dotMap[key] || "bg-gray-400";

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium", style, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
      {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
    </span>
  );
}
