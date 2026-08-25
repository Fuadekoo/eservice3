"use client";

import * as React from "react";
import { Check, Copy, Hash } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

type RequestNumberProps = {
  value?: string | null;
  /** `plain` for dense rows and cards, `badge` where it should stand out. */
  variant?: "plain" | "badge";
  /** Show a copy button — worth it wherever the customer may need to quote it. */
  copyable?: boolean;
  className?: string;
};

/**
 * The reference a customer is given when they apply (REQ-YYYYMMDD-NNNNN).
 *
 * Rendered in a monospace face with the digits emphasised, because the whole
 * point of the number is that someone reads it back over the phone or types it
 * into the search box.
 */
export function RequestNumber({
  value,
  variant = "plain",
  copyable = false,
  className,
}: RequestNumberProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);

  // Reset the tick even if the component stays mounted (e.g. a pinned dialog).
  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!value) return null;

  const handleCopy = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(t("Request number copied"));
    } catch {
      toast.error(t("Could not copy the request number"));
    }
  };

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5",
        variant === "badge" &&
          "rounded-lg border border-primary/20 bg-primary/5 px-2 py-1",
        className,
      )}
      title={t("Request number")}
    >
      <Hash className="size-3 shrink-0 text-muted-foreground" />
      <span className="truncate font-mono text-xs font-semibold tracking-tight tabular-nums">
        {value}
      </span>
      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={t("Copy request number")}
          className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? (
            <Check className="size-3 text-emerald-600" />
          ) : (
            <Copy className="size-3" />
          )}
        </button>
      )}
    </span>
  );
}
