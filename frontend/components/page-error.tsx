"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

interface PageErrorProps {
  message?: string;
  error?: string;
  title?: string;
  statusCode?: number;
  onRetry?: () => void | Promise<void>;
}

export const PageError: React.FC<PageErrorProps> = ({
  message,
  error,
  title,
  statusCode,
  onRetry,
}) => {
  const { t } = useTranslation();

  const errorMessage = error || message || t("An unexpected error occurred.");

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in duration-500">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight">
        {statusCode
          ? `${title || t("Error Occurred")} (${statusCode})`
          : title || t("Error Occurred")}
      </h2>
      <p className="mt-2 mb-6 max-w-md text-muted-foreground">
        {errorMessage}
      </p>
      {onRetry && (
        <Button onClick={() => onRetry()} variant="outline" size="sm">
          <RefreshCcw className="mr-2 h-4 w-4" />
          {t("Try Again")}
        </Button>
      )}
    </div>
  );
};
