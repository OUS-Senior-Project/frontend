'use client';

import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface UploadDatasetButtonProps {
  onDatasetUpload: (file: File) => void;
  inputId?: string;
  buttonLabel?: string;
}

export const SAMPLE_TEMPLATE_HREF = '/templates/roster-upload-template.csv';

export function UploadDatasetButton({
  onDatasetUpload,
  inputId = 'dataset-upload',
  buttonLabel = 'Upload Dataset',
}: UploadDatasetButtonProps) {
  const helpTextId = `${inputId}-help`;
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="bg-transparent"
        aria-describedby={helpTextId}
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        <Upload className="mr-2 h-4 w-4" />
        {buttonLabel}
      </Button>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".csv,.xlsx"
        tabIndex={-1}
        aria-label={buttonLabel}
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
      <div
        id={helpTextId}
        className="max-w-xl space-y-1 text-xs text-muted-foreground"
      >
        <p>Accepted file types: .csv and .xlsx.</p>
        <p>
          Required columns include: Current Moment (DateTime), Academic Level,
          Student Type.
        </p>
        <a
          href={SAMPLE_TEMPLATE_HREF}
          download
          className="inline-flex font-medium text-foreground underline underline-offset-2 hover:text-primary"
        >
          Download sample upload template (.csv)
        </a>
      </div>
    </div>
  );
}
