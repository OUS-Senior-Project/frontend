import * as React from 'react';

let currentTheme: string | undefined = 'light';

export function __setTheme(theme: string | undefined) {
  currentTheme = theme;
}

export function ThemeProvider({
  children,
}: React.PropsWithChildren<Record<string, unknown>>) {
  return <div data-testid="theme-provider">{children}</div>;
}

export function useTheme() {
  return {
    theme: currentTheme,
    setTheme: jest.fn(),
    resolvedTheme: currentTheme,
  };
}
