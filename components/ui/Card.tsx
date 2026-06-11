import * as React from "react";
import { cn } from "./cn";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg bg-bg-surface p-6 shadow-card border border-border",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

export const CardTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-h3 text-text-primary", className)} {...props} />
);

export const CardBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-3 text-body text-text-secondary", className)} {...props} />
);
