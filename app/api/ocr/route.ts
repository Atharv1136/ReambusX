import { NextRequest } from 'next/server';
import { handleRouteError, success, failure } from '@/lib/http';
import { requireSession } from '@/lib/auth-guards';

export async function POST(request: NextRequest) {
  try {
    await requireSession();

    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return failure(400, 'INVALID_INPUT', 'imageBase64 is required.');
    }

    // Dynamic import for tesseract.js (server-side OCR)
    const Tesseract = await import('tesseract.js');
    const { data } = await Tesseract.recognize(
      Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64'),
      'eng',
    );

    const text = data.text;

    // Parse OCR text to extract structured data
    const parsed = parseReceiptText(text);

    return success({ rawText: text, parsed });
  } catch (error) {
    return handleRouteError(error);
  }
}

function parseReceiptText(text: string) {
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

  // Guess category
  const lowText = text.toLowerCase();
  let category = 'Miscellaneous';
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
  };
}
