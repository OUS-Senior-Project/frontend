import apiClient from './client';
import type { EnrollmentResponse } from '../types';

export const fetchItems = async (): Promise<EnrollmentResponse> => {
  if (!apiClient.defaults.baseURL) {
    throw new Error(
      'API base URL is not set. Add REACT_APP_API_BASE to your .env file.'
    );
  }

  const response = await apiClient.get<EnrollmentResponse>('/items');

  if (!response.data) {
    throw new Error('No data received from /items.');
  }

  return response.data;
};
