import * as React from "react";
import { cn } from "@/components/ui/cn";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "inProgress"
  | "awaitingConfirm"
  | "completed"
  | "cancelledFull"
  | "cancelledPartial"
  | "refunded";

const STATUS_BADGE_CLASS: Record<BookingStatus, string> = {
  pending: "bg-badge-pending-bg text-badge-pending-fg",
  confirmed: "bg-badge-confirmed-bg text-badge-confirmed-fg",
  inProgress: "bg-badge-inprogress-bg text-badge-inprogress-fg",
  awaitingConfirm: "bg-badge-pending-bg text-badge-pending-fg",
  completed: "bg-badge-completed-bg text-badge-completed-fg",
  cancelledFull: "bg-badge-refunded-bg text-badge-refunded-fg",
  cancelledPartial: "bg-badge-refunded-bg text-badge-refunded-fg",
  refunded: "bg-badge-cancelled-bg text-badge-cancelled-fg",
};

export function BookingStatusBadge({
  status,
  children,
}: {
  status: BookingStatus;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-sm px-2.5 text-[14px] font-semibold",
        STATUS_BADGE_CLASS[status]
      )}
    >
      {children}
    </span>
  );
}
