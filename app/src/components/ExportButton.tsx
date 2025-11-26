import React from 'react';
import { Download } from 'lucide-react';

export const ExportButton: React.FC = () => {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg shadow-sm hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      onClick={() =>
        alert(
          'This is a visual-only prototype. Export functionality is not implemented.'
        )
      }
    >
      <Download className="h-5 w-5 mr-2" />
      <span>Download Enrollment Summary</span>
    </button>
  );
};
