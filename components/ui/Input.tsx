import * as React from "react";
import { cn } from "./cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "block w-full min-h-touch-btn rounded-md bg-bg-base px-4 text-body text-text-primary",
        "border-[1.5px] border-border placeholder:text-text-placeholder",
        "focus:border-brand focus:outline-none",
        invalid && "border-danger focus:border-danger",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
