"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface PasswordInputProps {
  id: string;
  name: string;
  minLength?: number;
  required?: boolean;
  placeholder?: string;
}

export function PasswordInput({ id, name, minLength, required, placeholder }: PasswordInputProps) {
  const [show, setShow] = React.useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        autoComplete="new-password"
        minLength={minLength}
        required={required}
        placeholder={placeholder}
        className="pr-12"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-text-secondary hover:text-text-primary"
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
      </button>
    </div>
  );
}
