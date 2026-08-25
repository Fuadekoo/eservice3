"use client";

import * as React from "react";
import { FileText, Upload, X, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { uploadFileOnly, formatFileSize } from "@/lib/file-upload";
import { REPORT_PDF_MAX_BYTES } from "@/lib/report-utils";
import { useTranslation } from "@/lib/i18n";

export type ReportPdfFile = {
  name: string;
  filepath: string;
  size: number;
};

type ReportPdfUploadProps = {
  value: ReportPdfFile | null;
  onChange: (file: ReportPdfFile | null) => void;
  disabled?: boolean;
  className?: string;
};

export function ReportPdfUpload({
  value,
  onChange,
  disabled,
  className,
}: ReportPdfUploadProps) {
  const { t } = useTranslation();

  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error(t("Only PDF files are allowed"));
      return;
    }
    if (file.size > REPORT_PDF_MAX_BYTES) {
      toast.error(t("PDF must be 10 MB or smaller"));
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadFileOnly(file);
      onChange({
        name: result.originalName || file.name,
        filepath: result.filename,
        size: result.size ?? file.size,
      });
      toast.success(t("PDF uploaded"));
    } catch {
      toast.error(t("Failed to upload PDF"));
    } finally {
      setIsUploading(false);
    }
  };

  const onInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await handleFile(file);
  };

  const onDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    if (disabled || isUploading) return;
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await handleFile(file);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={onInputChange}
      />

      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
            <FileText className="size-5 text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {value.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("PDF ·")} {formatFileSize(value.size)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-full"
            disabled={disabled || isUploading}
            onClick={() => onChange(null)}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30",
            (disabled || isUploading) && "pointer-events-none opacity-60",
          )}
        >
          {isUploading ? (
            <Loader2 className="size-8 animate-spin text-primary" />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
              <Upload className="size-6 text-primary" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">
              {isUploading ? t("Uploading PDF...") : t("Upload report PDF")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("Drag and drop or click to browse · PDF only · Max 10 MB")}
            </p>
          </div>
        </button>
      )}

      {value && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ExternalLink className="size-3.5" />
          {t("The PDF will be attached to your report submission.")}
        </p>
      )}
    </div>
  );
}
