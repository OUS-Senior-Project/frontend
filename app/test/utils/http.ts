function createHeaderBag(headers: Record<string, string> = {}) {
  const table = new Map<string, string>();
  Object.entries(headers).forEach(([key, value]) => {
    table.set(key.toLowerCase(), value);
  });

  return {
    get(name: string) {
      return table.get(name.toLowerCase()) ?? null;
    },
  };
}

export function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {}
) {
  const status = init.status ?? 200;
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: createHeaderBag({
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    }),
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

export function emptyResponse(
  init: { status?: number; headers?: Record<string, string> } = {}
) {
  const status = init.status ?? 200;
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: createHeaderBag(init.headers ?? {}),
    text: async () => '',
  } as unknown as Response;
}

export function textResponse(
  body: string,
  init: { status?: number; headers?: Record<string, string> } = {}
) {
  const status = init.status ?? 200;
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: createHeaderBag({
      'content-type': 'text/plain',
      ...(init.headers ?? {}),
    }),
    text: async () => body,
  } as unknown as Response;
}

export function installFetchMock() {
  const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
  Object.defineProperty(globalThis, 'fetch', {
    writable: true,
    value: fetchMock,
  });
  return fetchMock;
}
