export type QueryPrimitive = string | number | boolean;
export type QueryValue = QueryPrimitive | QueryPrimitive[];

interface FilterQueryParamsOptions {
  endpoint: string;
  params: Record<string, unknown>;
  allowedKeys: readonly string[];
}

function isQueryPrimitive(value: unknown): value is QueryPrimitive {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  return typeof value === 'string' || typeof value === 'boolean';
}

function isQueryArray(value: unknown): value is QueryPrimitive[] {
  return (
    Array.isArray(value) && value.length > 0 && value.every(isQueryPrimitive)
  );
}

function isOmittedValue(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function warnDroppedKeys(endpoint: string, droppedKeys: string[]) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (!droppedKeys.length) {
    return;
  }

  const uniqueDroppedKeys = Array.from(new Set(droppedKeys)).sort();
  console.warn(
    `[api-query-guardrail] Dropped invalid/unsupported query params for ${endpoint}: ${uniqueDroppedKeys.join(', ')}`
  );
}

export function filterQueryParams({
  endpoint,
  params,
  allowedKeys,
}: FilterQueryParamsOptions): Record<string, QueryValue> {
  const allowed = new Set(allowedKeys);
  const filtered: Record<string, QueryValue> = {};
  const droppedKeys: string[] = [];

  Object.entries(params).forEach(([key, value]) => {
    if (!allowed.has(key)) {
      droppedKeys.push(key);
      return;
    }

    if (isOmittedValue(value)) {
      return;
    }

    if (!isQueryPrimitive(value) && !isQueryArray(value)) {
      droppedKeys.push(key);
      return;
    }

    filtered[key] = value;
  });

  warnDroppedKeys(endpoint, droppedKeys);
  return filtered;
}
