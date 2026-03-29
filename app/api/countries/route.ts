import { handleRouteError, success } from '@/lib/http';

type CountryApiResponse = {
  name?: { common?: string };
  currencies?: Record<string, { symbol?: string; name?: string }>;
  flag?: string;
};

let countriesCache: { expiresAt: number; data: unknown[] } | null = null;

export async function GET() {
  try {
    const now = Date.now();
    if (countriesCache && countriesCache.expiresAt > now) {
      return success({ countries: countriesCache.data });
    }

    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies,flag', {
      next: { revalidate: 3600 },
    });

    const payload = (await response.json()) as CountryApiResponse[];

    const countries = payload
      .map((item) => {
        const countryName = item.name?.common;
        const currencyEntry = item.currencies ? Object.entries(item.currencies)[0] : null;
        if (!countryName || !currencyEntry) return null;

        const [currencyCode, currencyMeta] = currencyEntry;

        return {
          country: countryName,
          currencyCode,
          currencySymbol: currencyMeta?.symbol ?? currencyCode,
          currencyName: currencyMeta?.name ?? currencyCode,
          flag: item.flag ?? '',
        };
      })
      .filter((country): country is NonNullable<typeof country> => Boolean(country))
      .sort((a, b) => a.country.localeCompare(b.country));

    countriesCache = {
      data: countries,
      expiresAt: now + 60 * 60 * 1000,
    };

    return success({ countries });
  } catch (error) {
    return handleRouteError(error);
  }
}
