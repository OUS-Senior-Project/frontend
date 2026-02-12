import type { UIError } from './types';

export type ServiceErrorCode =
  | 'NOT_IMPLEMENTED'
  | 'DATASET_NOT_FOUND'
  | 'UPLOAD_FAILED'
  | 'UNKNOWN';

export class ServiceError extends Error {
  code: ServiceErrorCode;
  retryable: boolean;

  constructor(code: ServiceErrorCode, message: string, retryable = true) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.retryable = retryable;
  }
}

export function toUIError(
  error: unknown,
  fallbackMessage = 'Something went wrong.'
): UIError {
  if (error instanceof ServiceError) {
    return {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
    };
  }

  if (error instanceof Error) {
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
