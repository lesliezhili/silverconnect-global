import * as React from "react";
import { cn } from "./cn";

export type BadgeStatus =
  | "pending"
  | "confirmed"
  | "inprogress"
  | "completed"
  | "cancelled"
  | "refunded";

const statusClass: Record<BadgeStatus, string> = {
  pending: "bg-badge-pending-bg text-badge-pending-fg",
  confirmed: "bg-badge-confirmed-bg text-badge-confirmed-fg",
  inprogress: "bg-badge-inprogress-bg text-badge-inprogress-fg",
  completed: "bg-badge-completed-bg text-badge-completed-fg",
  cancelled: "bg-badge-cancelled-bg text-badge-cancelled-fg",
  refunded: "bg-badge-refunded-bg text-badge-refunded-fg",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatus;
}

export function Badge({
  status = "pending",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-3 py-1 text-small font-semibold",
        statusClass[status],
        className
      )}
      {...props}
    />
  );
}
