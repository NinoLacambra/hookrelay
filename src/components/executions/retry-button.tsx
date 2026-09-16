"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

export function RetryButton({
  executionId,
}: {
  executionId: number;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRetry() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/executions/${executionId}/retry`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      // A retry can legitimately return a failure because
      // the destination may still be unavailable.
      if (!response.ok && !data.execution) {
        throw new Error(
          data.message || "Failed to retry execution"
        );
      }

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to retry execution"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRetry}
        disabled={loading}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RotateCcw
          className={`h-3.5 w-3.5 ${
            loading ? "animate-spin" : ""
          }`}
        />

        {loading ? "Retrying..." : "Retry"}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}