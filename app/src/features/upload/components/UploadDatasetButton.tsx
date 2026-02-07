'use client';

import type { ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface UploadDatasetButtonProps {
  onDatasetUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  inputId?: string;
}

export function UploadDatasetButton({
  onDatasetUpload,
  inputId = 'csv-upload',
}: UploadDatasetButtonProps) {
  return (
    <>
      <label htmlFor={inputId}>
        <Button variant="outline" className="cursor-pointer bg-transparent" asChild>
          <span>
            <Upload className="mr-2 h-4 w-4" />
            Upload CSV
          </span>
        </Button>
      </label>
      <input
        id={inputId}
        type="file"
        accept=".csv"
        onChange={onDatasetUpload}
        className="sr-only"
      />
    </>
  );
}
