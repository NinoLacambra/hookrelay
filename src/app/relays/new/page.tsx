"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  ArrowLeft,
  Loader2,
  Webhook,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function NewRelayPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [destinationUrl, setDestinationUrl] =
    useState("");

  const [checkingAuth, setCheckingAuth] =
    useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();

    async function checkUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setCheckingAuth(false);
    }

    checkUser();
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/relays",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name,
            destinationUrl,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create relay"
        );
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create relay"
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Checking authentication...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        {/* Header */}
        <div className="mt-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Webhook className="h-5 w-5" />
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight">
            Create Relay
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Create a webhook endpoint and
            forward incoming events to your
            destination URL.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {/* Relay name */}
          <div>
            <label
              htmlFor="name"
              className="text-sm font-medium text-slate-700"
            >
              Relay name
            </label>

            <input
              id="name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Stripe Orders"
              required
              disabled={loading}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
            />

            <p className="mt-2 text-xs text-slate-400">
              A descriptive name for this
              webhook integration.
            </p>
          </div>

          {/* Destination URL */}
          <div className="mt-6">
            <label
              htmlFor="destination"
              className="text-sm font-medium text-slate-700"
            >
              Destination URL
            </label>

            <input
              id="destination"
              type="url"
              value={destinationUrl}
              onChange={(event) =>
                setDestinationUrl(
                  event.target.value
                )
              }
              placeholder="https://example.com/api/webhooks"
              required
              disabled={loading}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
            />

            <p className="mt-2 text-xs text-slate-400">
              HookRelay will forward incoming
              JSON payloads here.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-8 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {loading
              ? "Creating..."
              : "Create Relay"}
          </button>
        </form>
      </div>
    </main>
  );
}