import type { UIError } from './types';

export type ServiceErrorCode = string;

interface ServiceErrorOptions {
  retryable?: boolean;
  details?: unknown;
  requestId?: string;
  status?: number;
}

export class ServiceError extends Error {
  code: ServiceErrorCode;
  retryable: boolean;
  details?: unknown;
  requestId?: string;
  status?: number;

  constructor(
    code: ServiceErrorCode,
    message: string,
    retryableOrOptions: boolean | ServiceErrorOptions = true
  ) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;

    const options =
      typeof retryableOrOptions === 'boolean'
        ? { retryable: retryableOrOptions }
        : retryableOrOptions;

    this.retryable = options.retryable ?? true;
    this.details = options.details;
    this.requestId = options.requestId;
    this.status = options.status;
  }
}

interface ApiErrorOptions {
  code: string;
  message: string;
  status: number;
  retryable: boolean;
  details?: unknown;
  requestId?: string;
}

export class ApiError extends ServiceError {
  constructor(options: ApiErrorOptions) {
    super(options.code, options.message, {
      retryable: options.retryable,
      details: options.details,
      requestId: options.requestId,
      status: options.status,
    });
    this.name = 'ApiError';
  }
}

function isLikelyFetchNetworkFailure(error: Error | ServiceError) {
  if (error instanceof ServiceError) {
    return (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'FETCH_FAILED' ||
      (error.code === 'UNKNOWN' &&
        /failed to fetch|networkerror/i.test(error.message))
    );
  }

  if (error.name !== 'TypeError') {
    return false;
  }

  return /failed to fetch|networkerror/i.test(error.message);
}

function getCrossOriginCorsGuidance(error: Error | ServiceError) {
  if (
    typeof window === 'undefined' ||
    !window.location ||
    !process.env.NEXT_PUBLIC_API_BASE_URL
  ) {
    return null;
  }

  if (!isLikelyFetchNetworkFailure(error)) {
    return null;
  }

  const frontendOrigin = window.location.origin;

  try {
    const apiOrigin = new URL(
      process.env.NEXT_PUBLIC_API_BASE_URL,
      frontendOrigin
    ).origin;

    if (apiOrigin === frontendOrigin) {
      return null;
    }
  } catch {
    return null;
  }

  return `Backend did not provide a readable response in the browser. This is often caused by missing CORS headers or a backend that is not running. Ensure backend allows Origin ${frontendOrigin} (Access-Control-Allow-Origin).`;
}

export function toUIError(
  error: unknown,
  fallbackMessage = 'Something went wrong.'
): UIError {
  if (error instanceof ServiceError) {
    const message =
      (getCrossOriginCorsGuidance(error) ?? error.message) ||
      fallbackMessage;

    return {
      code: error.code,
      message,
      retryable: error.retryable,
      ...(error.details !== undefined ? { details: error.details } : {}),
      ...(error.requestId ? { requestId: error.requestId } : {}),
      ...(error.status !== undefined ? { status: error.status } : {}),
    };
  }

  if (error instanceof Error) {
    const corsGuidance = getCrossOriginCorsGuidance(error);
    if (corsGuidance) {
      return {
        code: 'NETWORK_ERROR',
        message: corsGuidance,
        retryable: true,
      };
    }

    return {
      code: 'UNKNOWN',
      message: error.message || fallbackMessage,
      retryable: true,
    };
  }

  return {
    code: 'UNKNOWN',
    message: fallbackMessage,
    retryable: true,
  };
}
