'use client';

import { Upload } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface UploadDatasetButtonProps {
  onDatasetUpload: (file: File) => void;
  inputId?: string;
  buttonLabel?: string;
}

export function UploadDatasetButton({
  onDatasetUpload,
  inputId = 'dataset-upload',
  buttonLabel = 'Upload Dataset',
}: UploadDatasetButtonProps) {
  return (
    <>
      <label htmlFor={inputId}>
        <Button
          variant="outline"
          className="cursor-pointer bg-transparent"
          asChild
        >
          <span>
            <Upload className="mr-2 h-4 w-4" />
            {buttonLabel}
          </span>
        </Button>
      </label>
      <input
        id={inputId}
        type="file"
        accept=".csv,.xlsx"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }

          onDatasetUpload(file);
          event.target.value = '';
        }}
        className="sr-only"
      />
    </>
  );
}
