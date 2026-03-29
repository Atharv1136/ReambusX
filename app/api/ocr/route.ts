import { NextRequest } from 'next/server';
import path from 'node:path';
import { handleRouteError, success, failure } from '@/lib/http';
import { requireSession } from '@/lib/auth-guards';

export const runtime = 'nodejs';

type ParsedReceipt = {
  amount: number | null;
  date: string | null;
  vendorName: string | null;
  category: 'Travel' | 'Food' | 'Office Supplies' | 'Medical' | 'Miscellaneous';
  description: string | null;
  currencyCode: string | null;
};

export async function POST(request: NextRequest) {
  try {
    await requireSession();

    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return failure(400, 'INVALID_INPUT', 'imageBase64 is required.');
    }

    const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    // Use absolute filesystem path to avoid bundler virtual module paths.
    const workerPath = path.join(
      process.cwd(),
      'node_modules',
      'tesseract.js',
      'src',
      'worker-script',
      'node',
      'index.js',
    );
    const cachePath = path.join(process.cwd(), '.cache', 'tesseract');

    const Tesseract = await import('tesseract.js');
    const { data } = await Tesseract.recognize(imageBuffer, 'eng', {
      workerPath,
      cachePath,
    });

    const text = data.text;

    const regexParsed = parseReceiptText(text);
    const aiParsed = await parseReceiptWithOpenAI(text);
    const parsed = mergeParsedReceipt(regexParsed, aiParsed);

    return success({ rawText: text, parsed });
  } catch (error) {
    return handleRouteError(error);
  }
}

function parseReceiptText(text: string): ParsedReceipt {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Try to extract amount (look for currency patterns)
  const amountPatterns = [
    /(?:total|amount|grand total|subtotal|sum)[:\s]*[\$€£₹¥]?\s*([\d,]+\.?\d*)/i,
    /[\$€£₹¥]\s*([\d,]+\.?\d*)/,
    /([\d,]+\.\d{2})/,
  ];

  let amount: number | null = null;
  for (const pattern of amountPatterns) {
    for (const line of lines) {
      const match = line.match(pattern);
      if (match) {
        const parsed = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(parsed) && parsed > 0) {
          amount = parsed;
          break;
        }
      }
    }
    if (amount !== null) break;
  }

  // Try to extract date
  const datePatterns = [
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4})/i,
  ];

  let date: string | null = null;
  for (const pattern of datePatterns) {
    for (const line of lines) {
      const match = line.match(pattern);
      if (match) {
        date = match[1];
        break;
      }
    }
    if (date) break;
  }

  // Use first non-numeric line as vendor/description
  const vendorName = lines.find((l) => l.length > 2 && !/^\d/.test(l) && !/total|amount|tax|subtotal|receipt/i.test(l)) ?? null;

  const currencyCode = detectCurrencyCode(text);

  // Guess category
  const lowText = text.toLowerCase();
  let category: ParsedReceipt['category'] = 'Miscellaneous';
  if (/restaurant|cafe|coffee|food|dining|lunch|dinner|breakfast|pizza|burger/i.test(lowText)) category = 'Food';
  else if (/hotel|flight|uber|taxi|travel|airline|airport|train/i.test(lowText)) category = 'Travel';
  else if (/pharmacy|medical|hospital|clinic|health|doctor/i.test(lowText)) category = 'Medical';
  else if (/office|supplies|stationery|paper|pen|printer/i.test(lowText)) category = 'Office Supplies';

  return {
    amount,
    date,
    vendorName,
    category,
    description: vendorName ? `Expense at ${vendorName}` : null,
    currencyCode,
  };
}

function detectCurrencyCode(text: string) {
  const upper = text.toUpperCase();
  const knownCodes = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD', 'AED'];
  const symbolMap: Record<string, string> = {
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '₹': 'INR',
    '¥': 'JPY',
  };

  for (const code of knownCodes) {
    if (upper.includes(code)) return code;
  }

  for (const [symbol, code] of Object.entries(symbolMap)) {
    if (text.includes(symbol)) return code;
  }

  return null;
}

function mergeParsedReceipt(base: ParsedReceipt, ai: ParsedReceipt | null): ParsedReceipt {
  if (!ai) return base;

  return {
    amount: ai.amount ?? base.amount,
    date: ai.date ?? base.date,
    vendorName: ai.vendorName ?? base.vendorName,
    category: ai.category ?? base.category,
    description: ai.description ?? base.description,
    currencyCode: ai.currencyCode ?? base.currencyCode,
  };
}

async function parseReceiptWithOpenAI(text: string): Promise<ParsedReceipt | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content:
              'Extract receipt fields. Only use provided OCR text. Return strict JSON with keys: amount, date, vendorName, category, description, currencyCode. Use category only from Travel, Food, Office Supplies, Medical, Miscellaneous. Use null when unknown. Prefer concise but meaningful description.',
          },
          {
            role: 'user',
            content: `OCR text:\n${text}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return null;

    const normalized = extractJsonObject(content);
    if (!normalized) return null;

    return sanitizeAiParsed(normalized);
  } catch {
    return null;
  }
}

function extractJsonObject(input: string) {
  const trimmed = input.trim();
  const direct = safeJsonParse(trimmed);
  if (direct) return direct;

  const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i)?.[1];
  if (fenced) {
    const parsed = safeJsonParse(fenced.trim());
    if (parsed) return parsed;
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const parsed = safeJsonParse(trimmed.slice(firstBrace, lastBrace + 1));
    if (parsed) return parsed;
  }

  return null;
}

function safeJsonParse(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function sanitizeAiParsed(input: Record<string, unknown>): ParsedReceipt {
  const allowedCategories: ParsedReceipt['category'][] = [
    'Travel',
    'Food',
    'Office Supplies',
    'Medical',
    'Miscellaneous',
  ];

  const amount =
    typeof input.amount === 'number'
      ? input.amount
      : typeof input.amount === 'string'
        ? Number.parseFloat(input.amount)
        : null;

  const categoryCandidate = typeof input.category === 'string' ? input.category.trim() : '';
  const category = allowedCategories.includes(categoryCandidate as ParsedReceipt['category'])
    ? (categoryCandidate as ParsedReceipt['category'])
    : 'Miscellaneous';

  const currency = typeof input.currencyCode === 'string' ? input.currencyCode.toUpperCase().slice(0, 3) : null;

  return {
    amount: Number.isFinite(amount as number) ? (amount as number) : null,
    date: typeof input.date === 'string' && input.date.trim() ? input.date.trim() : null,
    vendorName: typeof input.vendorName === 'string' && input.vendorName.trim() ? input.vendorName.trim() : null,
    category,
    description: typeof input.description === 'string' && input.description.trim() ? input.description.trim() : null,
    currencyCode: currency && /^[A-Z]{3}$/.test(currency) ? currency : null,
  };
}
