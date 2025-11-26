import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

type UploadStatus = 'idle' | 'success' | 'error';

export const FileUploadPanel: React.FC = () => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setFileName(file.name);

      // Simulated upload logic
      if (file.name.endsWith('.xlsx')) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } else {
      setFileName(null);
      setStatus('idle');
    }
  };

  const getStatusMessage = () => {
    switch (status) {
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
            <span>Error: Invalid file type. Please upload a '.xlsx' file.</span>
          </div>
        );
      default:
        return (
          <p className="text-slate-500">
            Please select a Workday enrollment spreadsheet (.xlsx)
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
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".xlsx,.xls"
          />
        </label>

        <div className="text-sm">{getStatusMessage()}</div>
      </div>
    </div>
  );
};
