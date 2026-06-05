"use client";

import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormOTPInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  description?: string;
  length?: number;
}

export function FormOTPInput<T extends FieldValues>({
  control,
  name,
  label = "OTP Code",
  description,
  length = 6,
}: FormOTPInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          {label && <Label>{label}</Label>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          <Input
            {...field}
            type="text"
            inputMode="numeric"
            maxLength={length}
            placeholder={`Enter ${length}-digit code`}
            className="text-center text-2xl tracking-widest font-mono"
            onChange={(e) => {
              // Only allow numbers
              const value = e.target.value.replace(/\D/g, "").slice(0, length);
              field.onChange(value);
            }}
          />
          {fieldState.error && (
            <p className="text-xs text-red-500">{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  );
}


