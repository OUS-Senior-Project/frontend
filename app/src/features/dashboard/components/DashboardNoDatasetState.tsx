'use client';

import { Database } from 'lucide-react';
import { UploadDatasetButton } from '@/features/upload/components/UploadDatasetButton';
import type { UIError } from '@/lib/api/types';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Spinner } from '@/shared/ui/spinner';

interface DashboardNoDatasetStateProps {
  onDatasetUpload: (file: File) => void;
  uploadLoading: boolean;
  uploadError: UIError | null;
}

export function DashboardNoDatasetState({
  onDatasetUpload,
  uploadLoading,
  uploadError,
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
          {uploadLoading && (
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Submitting dataset...
            </span>
          )}
        </div>
        {uploadError && (
          <Alert variant="destructive">
            <Database />
            <AlertTitle>Upload unavailable</AlertTitle>
            <AlertDescription>{uploadError.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
