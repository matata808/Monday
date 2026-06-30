import { useCallback, useState } from "react";

export function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const updateValue = useCallback(
    (nextValue) => {
      setValue((currentValue) => {
        const resolvedValue =
          typeof nextValue === "function" ? nextValue(currentValue) : nextValue;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolvedValue));
        } catch {
          // Storage can be unavailable in private or locked-down browsers.
        }
        return resolvedValue;
      });
    },
    [key],
  );

  return [value, updateValue];
}

