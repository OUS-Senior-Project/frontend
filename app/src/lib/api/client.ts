export interface ApiClient {
  get<T>(_path: string): Promise<T>;
  post<T>(_path: string, _body?: unknown): Promise<T>;
}

export function createApiClient(
  _baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
): ApiClient {
  return {
    async get<T>(): Promise<T> {
      throw new Error('Not implemented: API GET client wiring (Campaign 3)');
    },
    async post<T>(): Promise<T> {
      throw new Error('Not implemented: API POST client wiring (Campaign 3)');
    },
  };
}

export const apiClient = createApiClient();
