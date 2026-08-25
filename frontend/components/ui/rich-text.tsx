"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { looksLikeHtml, sanitizeHtml } from "@/lib/rich-text";

/** Never fires — the snapshot only changes once, at hydration. */
const emptySubscribe = () => () => {};

type RichTextProps = {
  value?: string | null;
  className?: string;
  /** Rendered when there is nothing to show. */
  fallback?: React.ReactNode;
};

/**
 * Renders content authored in the rich-text editor.
 *
 * Values written before the editor existed are plain text, so those are
 * rendered as text with their line breaks preserved rather than pushed through
 * the HTML path.
 */
export function RichText({ value, className, fallback = null }: RichTextProps) {
  const isHtml = looksLikeHtml(value);

  // Sanitising needs the browser's parser, so the server pass — and the first
  // client render, which must match it — return the raw string; the cleaned
  // markup swaps in immediately afterwards. `useSyncExternalStore` is the
  // hydration-safe way to ask "am I on the client yet".
  const isClient = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const html = React.useMemo(() => {
    if (!isHtml) return "";
    // Server pass: emit the stored markup as-is so hydration matches. It is
    // already sanitised on write; this pass is the belt-and-braces one.
    return isClient ? sanitizeHtml(value) : (value ?? "");
  }, [value, isHtml, isClient]);

  if (!value || !value.trim()) return <>{fallback}</>;

  if (!isHtml) {
    return (
      <div className={cn("whitespace-pre-wrap", className)}>{value}</div>
    );
  }

  return (
    <div
      className={cn("tiptap-content", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Single-line preview of rich-text content for cards and table rows, where the
 * markup would only get in the way.
 */
export function richTextToPlain(value?: string | null): string {
  if (!value) return "";
  if (!looksLikeHtml(value)) return value;
  return value
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}
