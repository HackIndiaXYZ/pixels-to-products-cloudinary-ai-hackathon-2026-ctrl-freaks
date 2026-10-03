'use client';

import { useState } from 'react';
import { Button } from './ui';

export function ShareActions({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        try {
          await navigator.share({ title, url: window.location.href });
          return;
        } catch {
          // User cancelled or clipboard fallback
        }
      }
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="primary" size="md" onClick={handleCopy}>
        {copied ? '✓ Link Copied to Clipboard' : 'Share Opportunity Link'}
      </Button>
      <Button
        variant="secondary"
        size="md"
        onClick={() => window.print()}
        className="hidden sm:inline-flex"
      >
        Export PDF Spec
      </Button>
    </div>
  );
}
