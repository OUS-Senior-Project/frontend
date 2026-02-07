'use client';

import * as React from 'react';
import type { ChartConfig } from './chart-types';

type ChartContextProps = { config: ChartConfig };
const ChartContext = React.createContext<ChartContextProps | null>(null);

export function ChartProvider({
  config,
  children,
}: {
  config: ChartConfig;
  children: React.ReactNode;
}) {
  return (
    <ChartContext.Provider value={{ config }}>{children}</ChartContext.Provider>
  );
}

export function useChart() {
  const context = React.useContext(ChartContext);
  if (!context)
    throw new Error('useChart must be used within a <ChartContainer />');
  return context;
}
