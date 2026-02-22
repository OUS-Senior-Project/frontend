'use client';

import { AlertCircle } from 'lucide-react';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { DashboardNoDatasetState } from '@/features/dashboard/components/DashboardNoDatasetState';
import { DashboardTabs } from '@/features/dashboard/components/DashboardTabs';
import { useDashboardMetricsModel } from '@/features/dashboard/hooks';
import { formatUIErrorMessage } from '@/lib/api/errors';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Spinner } from '@/shared/ui/spinner';

export default function DashboardPage() {
  const dashboard = useDashboardMetricsModel();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="p-6">
        {dashboard.datasetLoading && (
          <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-border bg-card">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Loading dashboard...
            </span>
          </div>
        )}

        {!dashboard.datasetLoading && dashboard.datasetError && (
          <Alert variant="destructive" className="max-w-3xl">
            <AlertCircle />
            <AlertTitle>Unable to load dashboard</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>{formatUIErrorMessage(dashboard.datasetError)}</p>
              <Button
                variant="outline"
                className="cursor-pointer bg-transparent"
                onClick={() => {
                  void dashboard.retryDataset();
                }}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!dashboard.datasetLoading &&
          !dashboard.datasetError &&
          dashboard.noDataset && (
            <DashboardNoDatasetState
              onDatasetUpload={dashboard.handleDatasetUpload}
              uploadLoading={dashboard.uploadLoading}
              uploadError={dashboard.uploadError}
            />
          )}

        {!dashboard.datasetLoading &&
          !dashboard.datasetError &&
          !dashboard.noDataset && <DashboardTabs model={dashboard} />}
      </main>
    </div>
  );
}
