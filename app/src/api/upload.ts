import axios from 'axios';
import type { UploadResponse } from '../types';

const API_BASE = process.env.REACT_APP_API_BASE;

/**
 * Uploads an enrollment file to POST {baseUrl}/api/v1/upload.
 * baseUrl comes from REACT_APP_API_BASE in .env.local.
 * Uses a plain axios call (no default Content-Type) so multipart/form-data is set correctly.
 */
export const uploadFile = async (file: File): Promise<UploadResponse> => {
  if (!API_BASE) {
    throw new Error(
      'API base URL is not set. Add REACT_APP_API_BASE to your .env file.'
    );
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post<UploadResponse>(
    `${API_BASE}/api/v1/upload`,
    formData
  );

  if (!response.data) {
    throw new Error('No data received from upload.');
  }

  return response.data;
};
