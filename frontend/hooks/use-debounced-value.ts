"use client";

import * as React from "react";

/** True for the values that mean "nothing typed". */
function isEmpty(value: unknown): boolean {
  return value === "" || value === null || value === undefined;
}

/**
 * The value, held back until it has stopped changing for `delay` milliseconds.
 *
 * For search boxes that drive a server request. The input itself stays
 * controlled by the raw state, so every keystroke still appears instantly;
 * only the fetch waits. Without this, a five-letter word costs five requests,
 * and their replies can arrive out of order and paint results that no longer
 * match what is in the box.
 *
 * An empty value is passed through at once, so clearing the box restores the
 * full list immediately rather than after a pause.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return isEmpty(value) ? value : debounced;
}
