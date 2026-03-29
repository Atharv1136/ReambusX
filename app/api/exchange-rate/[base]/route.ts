import { NextRequest } from 'next/server';
import { handleRouteError, failure, success } from '@/lib/http';

type ExchangeResponse = {
  base?: string;
  date?: string;
  rates?: Record<string, number>;
};

const cache = new Map<string, { expiresAt: number; data: ExchangeResponse }>();

export async function GET(_request: NextRequest, context: { params: Promise<{ base: string }> }) {
  try {
    const { base: rawBase } = await context.params;
    const base = rawBase.toUpperCase();

    if (!/^[A-Z]{3}$/.test(base)) {
      return failure(400, 'INVALID_BASE_CURRENCY', 'Base currency must be a 3-letter ISO code.');
    }

    const now = Date.now();
    const cached = cache.get(base);
    if (cached && cached.expiresAt > now) {
      return success(cached.data);
    }

    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return failure(502, 'EXCHANGE_RATE_UPSTREAM_ERROR', 'Unable to fetch exchange rates.');
    }

    const payload = (await response.json()) as ExchangeResponse;

    cache.set(base, {
      data: payload,
      expiresAt: now + 60 * 60 * 1000,
    });

    return success(payload);
  } catch (error) {
    return handleRouteError(error);
  }
}
