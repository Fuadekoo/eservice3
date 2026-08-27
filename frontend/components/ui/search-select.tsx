"use client";

import * as React from "react";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** One choice in the list. */
export type SearchSelectOption = {
  /** Submitted when chosen. Must be unique. */
  value: string;
  /** Primary text, and what search matches on. */
  label: string;
  /** Optional second line — an office name, a phone number. Also searchable. */
  description?: string;
  /** Groups options under a heading. Headings are not searched. */
  group?: string;
  disabled?: boolean;
};

/** How many options are rendered before "show more" appears. */
const PAGE_SIZE = 20;

/**
 * Casefold and strip accents so "Waajjirraa" matches "waajjiraa" and Amharic
 * text compares consistently.
 */
function normalize(text: string): string {
  return text
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * A select you can type in.
 *
 * Search runs over the whole option list rather than the visible page, so a
 * match on the two-hundredth entry is found on the first keystroke — the usual
 * failure of a paginated picker is that its filter only sees the current page.
 * Rendering is what is paged: the list starts at 20 rows and grows on demand,
 * which keeps a long list cheap to open without ever hiding it from search.
 *
 * The selected option keeps its label even while filtered out of view, so the
 * trigger never falls back to showing a raw id.
 */
export function SearchSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled,
  isLoading,
  className,
  triggerIcon,
  "aria-label": ariaLabel,
}: {
  options: SearchSelectOption[];
  value?: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  triggerIcon?: React.ReactNode;
  "aria-label"?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  // How many rows are shown, tied to the query it was grown for. Pairing the
  // two means a new search resets the page without an effect that would
  // re-render just to correct itself.
  const [shown, setShown] = React.useState({ query: "", count: PAGE_SIZE });
  const visible = shown.query === query ? shown.count : PAGE_SIZE;

  const selected = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  // Callers keep the value within the options — clearing it when the list
  // changes — so a selected value always resolves to a label here.
  const selectedLabel = selected?.label ?? "";

  const matches = React.useMemo(() => {
    const needle = normalize(query.trim());
    if (!needle) return options;
    // Every whitespace-separated word must appear somewhere, so "bole health"
    // finds "Health Office, Bole" regardless of word order.
    const words = needle.split(/\s+/);
    return options.filter((option) => {
      // Only the option's own text. Including the group heading would make
      // typing "office" match every row under a "This office" heading.
      const haystack = normalize(
        option.label + " " + (option.description ?? ""),
      );
      return words.every((word) => haystack.includes(word));
    });
  }, [options, query]);

  const page = matches.slice(0, visible);
  const remaining = matches.length - page.length;

  const grouped = React.useMemo(() => {
    const groups = new Map<string, SearchSelectOption[]>();
    for (const option of page) {
      const key = option.group ?? "";
      const bucket = groups.get(key);
      if (bucket) bucket.push(option);
      else groups.set(key, [option]);
    }
    return [...groups.entries()];
  }, [page]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled || isLoading}
          className={cn(
            "h-11 w-full justify-between rounded-xl border-border/50 bg-muted/30 px-3 font-normal",
            !selectedLabel && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
          {isLoading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            triggerIcon
          )}
          <span className="truncate">
            {selectedLabel || placeholder || t("Select an option")}
          </span>
        </span>
          <ChevronDown className="size-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--anchor-width)] min-w-56 rounded-xl p-0"
      >
        {/* cmdk's own filter only sees rendered rows, so matching is done above
            against the full list and its filter is turned off here. */}
        <Command shouldFilter={false}>
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder || t("Search...")}
              autoFocus
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {matches.length > 0 ? (
              <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                {matches.length}
              </span>
            ) : null}
          </div>

          <CommandList className="max-h-64">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage || t("Nothing found")}
            </CommandEmpty>

            {grouped.map(([group, items]) => (
              <CommandGroup key={group || "_"} heading={group || undefined}>
                {items.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className="rounded-lg"
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0",
                        option.value === value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{option.label}</span>
                      {option.description ? (
                        <span className="truncate text-[10px] text-muted-foreground">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}

            {remaining > 0 ? (
              <div className="border-t p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full rounded-lg text-xs font-semibold"
                  onClick={() => setShown({ query, count: visible + PAGE_SIZE })}
                >
                  {t("Show {count} more", { count: String(remaining) })}
                </Button>
              </div>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
