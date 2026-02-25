'use client';

import { UploadDatasetButton } from '@/features/upload/components/UploadDatasetButton';
import { DashboardUploadFeedbackAlert } from '@/features/dashboard/components/DashboardUploadFeedback';
import type { DashboardUploadFeedback } from '@/features/dashboard/types/uploadFeedback';
import type { UIError } from '@/lib/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface DashboardNoDatasetStateProps {
  onDatasetUpload: (file: File) => void;
  uploadLoading: boolean;
  uploadError: UIError | null;
  uploadFeedback: DashboardUploadFeedback | null;
  uploadRetryAvailable: boolean;
  onRetryUpload: () => void;
}

export function DashboardNoDatasetState({
  onDatasetUpload,
  uploadLoading,
  uploadError,
  uploadFeedback,
  uploadRetryAvailable,
  onRetryUpload,
}: DashboardNoDatasetStateProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          No dataset uploaded yet
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload a roster file to generate analytics.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <UploadDatasetButton
            onDatasetUpload={onDatasetUpload}
            buttonLabel="Upload file"
          />
        </div>
        <DashboardUploadFeedbackAlert
          uploadLoading={uploadLoading}
          uploadError={uploadError}
          uploadFeedback={uploadFeedback}
          uploadRetryAvailable={uploadRetryAvailable}
          onRetryUpload={onRetryUpload}
        />
      </CardContent>
    </Card>
  );
}
