"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { getToken } from "@/lib/auth-client";

interface PdfViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId?: string;
  filepath?: string;
  fileName?: string;
  version?: number; // Optional version number to view specific version
  publicToken?: string; // Optional public token for shared files (no auth required)
}

export function PdfViewerModal({
  open,
  onOpenChange,
  fileId,
  filepath,
  fileName,
  version,
  publicToken,
}: PdfViewerModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cleanup effect: revoke object URL when modal closes
  useEffect(() => {
    if (!open && pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [open, pdfUrl]);

  // Fetch effect: load PDF when modal opens
  useEffect(() => {
    // Only fetch when modal opens and we have either fileId or filepath
    if (!open || (!fileId && !filepath)) {
      setLoading(false);
      return;
    }

    // Reset state when opening
    setLoading(true);
    setError(null);

    // Fetch PDF as blob
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

    let fileUrl: string;
    let headers: HeadersInit = {};

    if (publicToken) {
      // Public share access
      const versionParam = version ? `?version=${version}` : "";
      fileUrl = `${baseURL}/share/public/${publicToken}/serve${versionParam}`;
      console.log(
        "[PdfViewerModal] Fetching PDF from public share:",
        fileUrl,
        version ? `(version ${version})` : "(latest)"
      );
      
      const token = getToken();
      if (token) {
        headers = {
          Authorization: `Bearer ${token}`,
        };
      }
    } else if (filepath) {
      // Strip leading "uploads/" if present — our route expects the relative path after /by-path/
      const cleanPath = filepath.startsWith("uploads/") ? filepath.slice("uploads/".length) : filepath;
      fileUrl = `${baseURL}/files/by-path/${cleanPath}`;
      console.log("[PdfViewerModal] Fetching request attachment:", fileUrl);
      const token = getToken();
      if (token) {
        headers = {
          Authorization: `Bearer ${token}`,
        };
      }
    } else {
      // Authenticated access
      const versionParam = version ? `?version=${version}` : "";
      fileUrl = `${baseURL}/files/${fileId}/serve${versionParam}`;
      console.log(
        "[PdfViewerModal] Fetching PDF from:",
        fileUrl,
        version ? `(version ${version})` : "(latest)"
      );

      const token = getToken();
      if (!token) {
        console.error("[PdfViewerModal] No authentication token found");
        setError("Authentication required. Please log in again.");
        setLoading(false);
        return;
      }
      headers = {
        Authorization: `Bearer ${token}`,
      };
    }

    let cancelled = false;

    fetch(fileUrl, { headers })
      .then((response) => {
        if (cancelled) return;
        console.log("[PdfViewerModal] Response status:", response.status);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(
              "File not found. The file may have been deleted or moved."
            );
          }
          if (response.status === 401 && !publicToken) {
            throw new Error("Authentication failed. Please log in again.");
          }
          if (response.status === 403) {
            return response.json().then((errorData) => {
              throw new Error(
                errorData.message ||
                  "Access denied. The share link may have expired or been deactivated."
              );
            });
          }
          return response.text().then((text) => {
            try {
              const errorData = JSON.parse(text);
              throw new Error(
                errorData.message || `Failed to load PDF (${response.status})`
              );
            } catch {
              throw new Error(
                `Failed to load PDF (${response.status}): ${text.substring(
                  0,
                  100
                )}`
              );
            }
          });
        }
        return response.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        if (!blob) {
          throw new Error("Failed to create blob from response.");
        }
        console.log("[PdfViewerModal] PDF blob created, size:", blob.size);
        if (blob.size === 0) {
          throw new Error("Received empty file. The file may be corrupted.");
        }
        // Cleanup previous URL if exists
        setPdfUrl((prevUrl) => {
          if (prevUrl) {
            URL.revokeObjectURL(prevUrl);
          }
          return URL.createObjectURL(blob);
        });
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[PdfViewerModal] Error loading PDF:", err);
        setError(err.message || "Failed to load PDF. Please try again.");
        setLoading(false);
      });

    // Cleanup function: cancel fetch if component unmounts or dependencies change
    return () => {
      cancelled = true;
    };
  }, [open, fileId, filepath, version, publicToken]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-screen !h-screen !max-w-none !max-h-none !m-0 !p-0 !rounded-none !top-0 !left-0 !translate-x-0 !translate-y-0 !sm:max-w-none z-[100]">
        {/* Visually Hidden DialogTitle for accessibility */}
        <DialogTitle className="sr-only">
          {fileName || "PDF Viewer"} - File Preview
        </DialogTitle>

        {/* Close Button - Red X Icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-[110] bg-white/90 hover:bg-white text-red-500 hover:text-red-700 rounded-full shadow-lg"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* PDF iframe */}
        <div className="flex-1 overflow-auto bg-muted/30 !p-0 !m-0 w-full h-full relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-[105]">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading PDF...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-[105]">
              <div className="text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    // Retry logic simple reload trick
                    onOpenChange(false);
                    setTimeout(() => onOpenChange(true), 100);
                  }}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}
          {pdfUrl && !loading && !error && (
            <div className="w-full h-full flex items-center justify-center p-0 m-0">
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title={fileName || "PDF Viewer"}
                style={{ minHeight: "100%" }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
