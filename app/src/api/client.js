import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE;

if (!API_BASE) {
  throw new Error('REACT_APP_API_BASE is not defined. Set it in your .env file.');
}

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
