interface UploadStatusPanelProps {
  uploadedDatasetName: string;
}

export function UploadStatusPanel({ uploadedDatasetName }: UploadStatusPanelProps) {
  return (
    <div className="mx-6 mt-4 rounded-lg bg-chart-2/10 px-4 py-2 text-sm text-chart-2">
      Successfully loaded: {uploadedDatasetName}
    </div>
  );
}
