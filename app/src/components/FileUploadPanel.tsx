import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadFile } from '../api/upload';
import type { UploadResponse } from '../types';

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

interface FileUploadPanelProps {
  onUploadSuccess?: (response: UploadResponse) => void;
}

export const FileUploadPanel: React.FC<FileUploadPanelProps> = ({
  onUploadSuccess,
}) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName(null);
      setStatus('idle');
      setErrorMessage(null);
      return;
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setFileName(file.name);
      setStatus('error');
      setErrorMessage('Invalid file type. Please select a .xlsx or .xls file.');
      return;
    }

    setFileName(file.name);
    setStatus('loading');
    setErrorMessage(null);

    try {
      const response = await uploadFile(file);
      setStatus('success');
      onUploadSuccess?.(response);
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Upload failed. Please try again.'
      );
    } finally {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex items-center text-blue-600">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Uploading {fileName}...</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span>
              Successfully uploaded: <strong>{fileName}</strong>
            </span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>{errorMessage ?? 'Upload failed.'}</span>
          </div>
        );
      default:
        return (
          <p className="text-slate-500">
            Please select a Workday enrollment spreadsheet (.xlsx or .xls)
          </p>
        );
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-700 mb-4">
        Upload Workday Enrollment File
      </h2>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
          <Upload className="h-5 w-5 mr-2" />
          <span>Choose File</span>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".xlsx,.xls"
            disabled={status === 'loading'}
          />
        </label>

        <div className="text-sm">{getStatusMessage()}</div>
      </div>
    </div>
  );
};
