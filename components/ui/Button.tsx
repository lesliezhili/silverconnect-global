import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-transform active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-white hover:bg-brand-hover shadow-sm",
        secondary:
          "bg-bg-base text-brand border-2 border-brand hover:bg-bg-surface",
        ghost: "bg-transparent text-brand hover:bg-bg-surface",
        danger: "bg-danger text-white hover:opacity-90",
      },
      size: {
        md: "min-h-touch-btn px-6 text-body",
        sm: "min-h-touch px-4 text-small",
        lg: "min-h-[64px] px-8 text-h3",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      block: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, block }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
