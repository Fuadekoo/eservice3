"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { ElementType, ReactNode } from "react";

export type PageTab = {
  label: string;
  value: string;
  badge?: number | string;
};

type PageLayoutProps = {
  title: string;
  description?: string;
  icon?: ElementType;
  actions?: ReactNode;
  tabs?: PageTab[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
};

/**
 * PageLayout – a uniform shell used across every dashboard page.
 *
 * Structure:
 *   ┌─────────────────────────────────┐
 *   │  Title   |  Description  | CTA  │  ← page header
 *   ├─────────────────────────────────┤
 *   │  Tab 1  │  Tab 2  │  Tab 3  …  │  ← horizontal tab bar (optional)
 *   ├─────────────────────────────────┤
 *   │                                 │
 *   │           {children}            │  ← page body
 *   │                                 │
 *   └─────────────────────────────────┘
 */
export function PageLayout({
  title,
  description,
  icon: Icon,
  actions,
  tabs,
  activeTab,
  onTabChange,
  children,
  className,
}: PageLayoutProps) {
  const hasTabs = tabs && tabs.length > 0;

  return (
    <div className={cn("flex min-h-full min-w-0 flex-col", className)}>
      {/* ── Header ─────────────────────────────────────── */}
      <div className="border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="min-w-0 px-4 pt-5 pb-0 sm:px-6 sm:pt-6 lg:px-8">
          {/* Title row */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {Icon && (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-10">
                  <Icon className="size-4.5 sm:size-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-2xl">
                  {title}
                </h1>
                {description && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground sm:line-clamp-1 sm:text-sm">
                    {description}
                  </p>
                )}
              </div>
            </div>
            {actions && (
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 sm:shrink-0">
                {actions}
              </div>
            )}
          </div>

          {/* ── Tab bar ──────────────────────────────────── */}
          {hasTabs && (
            <div
              className="flex gap-0 overflow-x-auto scrollbar-hide -mb-px"
              role="tablist"
              aria-label={`${title} navigation`}
            >
              {tabs!.map((tab) => {
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => onTabChange?.(tab.value)}
                    className={cn(
                      "relative flex items-center gap-2 shrink-0 px-4 py-3 text-sm font-medium transition-all duration-150 border-b-2 whitespace-nowrap",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0",
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                    )}
                  >
                    {tab.label}
                    {tab.badge !== undefined && tab.badge !== "" && (
                      <span
                        className={cn(
                          "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold",
                          isActive
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────── */}
      <div className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
