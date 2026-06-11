"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { cn } from "./cn";

export type ToastVariant = "success" | "error" | "warning" | "info";

const variantStyle: Record<
  ToastVariant,
  { bg: string; fg: string; Icon: React.ComponentType<{ size?: number }> }
> = {
  success: { bg: "bg-badge-completed-bg", fg: "text-badge-completed-fg", Icon: CheckCircle2 },
  error: { bg: "bg-badge-refunded-bg", fg: "text-badge-refunded-fg", Icon: XCircle },
  warning: { bg: "bg-badge-pending-bg", fg: "text-badge-pending-fg", Icon: AlertTriangle },
  info: { bg: "bg-badge-confirmed-bg", fg: "text-badge-confirmed-fg", Icon: Info },
};

export const ToastProvider = ToastPrimitive.Provider;

export function ToastViewport() {
  return (
    <ToastPrimitive.Viewport
      className="fixed bottom-4 right-4 z-[100] flex max-w-[min(480px,calc(100vw-32px))] flex-col gap-2 outline-none"
    />
  );
}

export interface AppToastProps {
  variant?: ToastVariant;
  title: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}

export function Toast({
  variant = "info",
  title,
  description,
  open,
  onOpenChange,
}: AppToastProps) {
  const { bg, fg, Icon } = variantStyle[variant];
  return (
    <ToastPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      duration={5000}
      className={cn(
        "flex items-start gap-3 rounded-md p-4 shadow-card border border-border",
        bg,
        fg
      )}
    >
      <Icon size={24} aria-hidden />
      <div className="flex-1">
        <ToastPrimitive.Title className="font-semibold">
          {title}
        </ToastPrimitive.Title>
        {description && (
          <ToastPrimitive.Description className="mt-1 text-small">
            {description}
          </ToastPrimitive.Description>
        )}
      </div>
    </ToastPrimitive.Root>
  );
}
