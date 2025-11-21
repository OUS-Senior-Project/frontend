import apiClient from './client';

export const fetchItems = async () => {
  const response = await apiClient.get('/items');
  return response.data;
};
