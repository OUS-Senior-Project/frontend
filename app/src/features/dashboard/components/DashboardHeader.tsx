'use client';

import { BarChart3 } from 'lucide-react';

export function DashboardHeader() {
  return (
    <header className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <BarChart3 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            OUS Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Howard University OUS Office
          </p>
        </div>
      </div>
    </header>
  );
}
