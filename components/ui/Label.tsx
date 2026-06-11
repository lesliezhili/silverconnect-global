import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "./cn";

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "block text-body font-semibold text-text-primary mb-2",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";
