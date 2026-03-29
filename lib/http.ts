import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import type { ApiError, ApiSuccess } from '@/lib/types';

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export function success<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, { status });
}

export function failure(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json<ApiError>(
    {
      ok: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status },
  );
}

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return failure(error.status, error.code, error.message, error.details);
  }

  if (error instanceof ZodError) {
    return failure(400, 'VALIDATION_ERROR', 'Request validation failed.', error.flatten());
  }

  console.error(error);
  return failure(500, 'INTERNAL_SERVER_ERROR', 'Something went wrong.');
}
