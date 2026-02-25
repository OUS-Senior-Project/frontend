'use client';

import { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { DashboardNoDatasetState } from '@/features/dashboard/components/DashboardNoDatasetState';
import { DashboardTabs } from '@/features/dashboard/components/DashboardTabs';
import { useDashboardMetricsModel } from '@/features/dashboard/hooks';
import { formatUIErrorMessage } from '@/lib/api/errors';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Spinner } from '@/shared/ui/spinner';

function DashboardLoadingFallback() {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-border bg-card">
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" />
        Loading dashboard...
      </span>
    </div>
  );
}

function DashboardPageContent() {
  const dashboard = useDashboardMetricsModel();
  return (
    <>
      {dashboard.datasetLoading && <DashboardLoadingFallback />}

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
            uploadFeedback={dashboard.uploadFeedback}
            uploadRetryAvailable={dashboard.uploadRetryAvailable}
            onRetryUpload={dashboard.retryDatasetUpload}
          />
        )}

      {!dashboard.datasetLoading &&
        !dashboard.datasetError &&
        !dashboard.noDataset && <DashboardTabs model={dashboard} />}
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="p-6">
        <Suspense fallback={<DashboardLoadingFallback />}>
          <DashboardPageContent />
        </Suspense>
      </main>
    </div>
  );
}
