"use client";

import React from "react";
import {
  Controller,
  useFormContext,
  Control,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";

interface FormInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control?: Control<TFieldValues>;
  name: TName;
  label?: string;
  placeholder?: string;
  description?: string;
  type?: React.HTMLInputTypeAttribute;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * FormInput component that works with react-hook-form
 * Can be used with or without FormProvider context
 */
export function FormInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control: externalControl,
  name,
  label,
  placeholder,
  description,
  type = "text",
  className,
  disabled = false,
  required = false,
}: FormInputProps<TFieldValues, TName>) {
  // Try to use form context if available, otherwise use external control
  let control: Control<TFieldValues> | undefined;
  try {
    const formContext = useFormContext<TFieldValues>();
    control = formContext.control || externalControl;
  } catch {
    // Not within FormProvider, use external control
    control = externalControl;
  }

  if (!control) {
    throw new Error(
      "FormInput requires either a control prop or to be used within a FormProvider"
    );
  }

  // Use Controller with Field pattern (works both with and without FormProvider)
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field>
          {label && (
            <FieldLabel>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FieldLabel>
          )}
          <Input
            {...field}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
            value={field.value || ""}
            aria-invalid={fieldState.invalid}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.error && (
            <FieldError>{fieldState.error.message}</FieldError>
          )}
        </Field>
      )}
    />
  );
}
