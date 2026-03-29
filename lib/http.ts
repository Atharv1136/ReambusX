import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import type { ApiError, ApiSuccess } from '@/lib/types';

type NodeLikeError = {
  code?: string;
  message?: string;
};

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

  const nodeError = error as NodeLikeError;
  const errorCode = nodeError?.code;

  if (errorCode === 'ENOTFOUND' || errorCode === 'EAI_AGAIN') {
    return failure(
      503,
      'DATABASE_DNS_ERROR',
      'Database is temporarily unreachable (DNS lookup failed). Please retry in a moment.',
    );
  }

  if (errorCode === 'ECONNREFUSED' || errorCode === 'ETIMEDOUT') {
    return failure(
      503,
      'DATABASE_CONNECTION_ERROR',
      'Database connection failed. Please retry in a moment.',
    );
  }

  if (errorCode === '23505') {
    return failure(409, 'CONFLICT', 'A record with the same unique value already exists.');
  }

  console.error(error);
  return failure(500, 'INTERNAL_SERVER_ERROR', 'Something went wrong.');
}
