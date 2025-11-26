import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE;

if (!API_BASE) {
  // Keep the app booting while surfacing a clear console hint.
  // Actual requests will still fail fast when base URL is missing.
  // eslint-disable-next-line no-console
  console.warn(
    'REACT_APP_API_BASE is not defined. Set it in your .env file to enable live data.'
  );
}

export const apiClient = axios.create({
  baseURL: API_BASE || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
