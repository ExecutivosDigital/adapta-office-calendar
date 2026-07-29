"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatCpf, normalizeCpf } from "@/lib/cpf";

type CpfInputProps = Omit<
  React.ComponentPropsWithoutRef<typeof Input>,
  "type" | "inputMode" | "maxLength" | "value" | "onChange"
> & {
  value: string;
  onValueChange: (rawCpf: string) => void;
};

export const CpfInput = React.forwardRef<HTMLInputElement, CpfInputProps>(
  ({ value, onValueChange, ...props }, ref) => (
    <Input
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="username"
      maxLength={14}
      value={formatCpf(value)}
      onChange={(event) => onValueChange(normalizeCpf(event.target.value))}
      {...props}
    />
  )
);

CpfInput.displayName = "CpfInput";
