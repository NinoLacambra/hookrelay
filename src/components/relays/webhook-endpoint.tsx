"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

export function WebhookEndpoint({
  webhookKey,
}: {
  webhookKey: string;
}) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const path = `/api/hooks/${webhookKey}`;
  const webhookUrl = origin ? `${origin}${path}` : path;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(webhookUrl);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy webhook URL:", error);
    }
  }

  return (
    <div>
      <code className="block break-all text-sm leading-6 text-indigo-700">
        {webhookUrl}
      </code>

      <button
        type="button"
        onClick={handleCopy}
        className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy endpoint
          </>
        )}
      </button>
    </div>
  );
}