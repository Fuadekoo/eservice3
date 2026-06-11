"use client";

import * as React from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { checkPasswordCriteria, getPasswordStrength } from "@/lib/password-strength";

export interface PasswordInputProps extends React.ComponentProps<"input"> {
  showStrength?: boolean;
}

const CRITERIA_LABELS: { key: keyof ReturnType<typeof checkPasswordCriteria>; label: string }[] = [
  { key: "length", label: "At least 8 characters" },
  { key: "uppercase", label: "One uppercase letter (A-Z)" },
  { key: "lowercase", label: "One lowercase letter (a-z)" },
  { key: "number", label: "One number (0-9)" },
  { key: "special", label: "One special character (!@#$...)" },
];

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrength, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const currentValue = showStrength
      ? typeof props.value === "string"
        ? props.value
        : ""
      : "";

    const strength = showStrength ? getPasswordStrength(currentValue) : null;
    const criteria = showStrength ? checkPasswordCriteria(currentValue) : null;
    const hasValue = currentValue.length > 0;

    return (
      <div>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            className={cn("pr-10", className)}
            ref={ref}
            {...props}
          />
          <button
            type="button"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground transition-colors"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
            <span className="sr-only">
              {showPassword ? "Hide password" : "Show password"}
            </span>
          </button>
        </div>

        {showStrength && hasValue && strength && criteria && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-all duration-300",
                      strength.score >= bar ? strength.colorClass : "bg-muted"
                    )}
                  />
                ))}
              </div>
              <span className={cn("text-xs font-semibold min-w-[3rem] text-right", strength.textClass)}>
                {strength.label}
              </span>
            </div>

            <ul className="space-y-0.5">
              {CRITERIA_LABELS.map(({ key, label }) => (
                <li
                  key={key}
                  className={cn(
                    "flex items-center gap-1.5 text-xs transition-colors",
                    criteria[key]
                      ? "text-green-600 dark:text-green-400"
                      : "text-muted-foreground"
                  )}
                >
                  {criteria[key] ? (
                    <Check className="size-3 shrink-0" />
                  ) : (
                    <X className="size-3 shrink-0 opacity-50" />
                  )}
                  {label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
