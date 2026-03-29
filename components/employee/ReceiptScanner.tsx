'use client';

import { useState, useEffect, useRef } from 'react';

type OcrResult = {
  amount: number | null;
  date: string | null;
  vendorName: string | null;
  category: string;
  description: string | null;
};

type ReceiptScannerProps = {
  onResult: (result: OcrResult) => void;
};

export default function ReceiptScanner({ onResult }: ReceiptScannerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      await processOcr(base64);
    };
    reader.readAsDataURL(file);
  }

  async function processOcr(imageBase64: string) {
    setProcessing(true);
    setProgress(10);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 85));
      }, 500);

      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      clearInterval(progressInterval);
      setProgress(95);

      const data = await res.json();
      if (data.ok) {
        setProgress(100);
        onResult(data.data.parsed);
      } else {
        setError(data.error?.message ?? 'OCR processing failed.');
      }
    } catch {
      setError('Failed to process receipt.');
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      void handleFile(file);
    }
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-colors ${
          processing ? 'border-accent-orange/60 bg-accent-orange/5' :
          imagePreview ? 'border-success/40 bg-success/5' :
          'border-border hover:border-accent-blue/50 hover:bg-accent-blue/5'
        } p-6 text-center`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        {imagePreview ? (
          <div className="space-y-3">
            <img src={imagePreview} alt="Receipt preview" className="mx-auto max-h-40 rounded-lg object-contain" />
            {processing && (
              <div className="space-y-1">
                <div className="h-1.5 w-full rounded-full bg-bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-orange to-accent-amber transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-accent-orange animate-pulse">Processing receipt with OCR...</p>
              </div>
            )}
            {!processing && (
              <p className="text-xs text-success">✓ Receipt scanned. Click to scan another.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="mx-auto h-10 w-10 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-text-primary font-medium">Drop receipt image or click to upload</p>
            <p className="text-xs text-text-secondary">Supports JPG, PNG, WEBP. OCR will auto-extract details.</p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
