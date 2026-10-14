import { useEffect, useState } from "react";

export const SEARCH_DEBOUNCE_DELAY = 5000;

export function useDebounce(value: string, delay = SEARCH_DEBOUNCE_DELAY) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}
