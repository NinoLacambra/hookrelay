import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import {
  ArrowLeft,
  CheckCircle2,
  CircleX,
  Clock3,
  ExternalLink,
  Webhook,
} from "lucide-react";

import { db } from "@/db";
import { executions, relays } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { RetryButton } from "@/components/executions/retry-button";
import { RelayActions } from "@/components/relays/relay-actions";
import { WebhookEndpoint } from "@/components/relays/webhook-endpoint";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RelayPage({
  params,
}: PageProps) {
  // Require authentication
  const user = await requireUser();

  const { id } = await params;
  const relayId = Number(id);

  // Validate relay ID
  if (!Number.isInteger(relayId) || relayId <= 0) {
    notFound();
  }

  // Find the relay only if it belongs to
  // the currently authenticated user
  const [relay] = await db
    .select()
    .from(relays)
    .where(
      and(
        eq(relays.id, relayId),
        eq(relays.userId, user.id)
      )
    )
    .limit(1);

  // Return 404 if relay doesn't exist
  // or belongs to another user
  if (!relay) {
    notFound();
  }

  // Execution history for this relay
  const executionList = await db
    .select()
    .from(executions)
    .where(eq(executions.relayId, relay.id))
    .orderBy(desc(executions.createdAt));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Back to dashboard */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

        {/* Header */}
        <header className="mt-8 flex flex-col gap-6 border-b border-slate-200 pb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Webhook className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {relay.name}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Created {relay.createdAt.toLocaleString()}
                </p>
              </div>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                relay.active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {relay.active ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Relay management */}
          <RelayActions
            relay={{
              id: relay.id,
              name: relay.name,
              destinationUrl: relay.destinationUrl,
              active: relay.active,
            }}
          />
        </header>

        {/* Relay configuration */}
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <InfoCard title="Webhook Endpoint">
            <WebhookEndpoint webhookKey={relay.webhookKey} />
          </InfoCard>

          <InfoCard title="Destination URL">
            <div className="flex items-start gap-2">
              <span className="break-all text-sm leading-6 text-slate-700">
                {relay.destinationUrl}
              </span>

              <a
                href={relay.destinationUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 shrink-0 text-slate-400 transition hover:text-slate-700"
                aria-label="Open destination URL"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </InfoCard>
        </section>

        {/* Execution history */}
        <section className="mt-10">
          <div>
            <h2 className="text-lg font-semibold">
              Execution History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Incoming webhook requests and delivery results.
            </p>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {executionList.length === 0 ? (
              <div className="p-8 text-sm text-slate-500">
                No webhook executions yet.
              </div>
            ) : (
              executionList.map((execution) => (
                <div
                  key={execution.id}
                  className="border-b border-slate-100 p-5 last:border-0"
                >
                  {/* Execution summary */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <ExecutionIcon
                        status={execution.status}
                      />

                      <div>
                        <p className="text-sm font-medium capitalize">
                          {execution.status}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Execution #{execution.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="text-sm text-slate-500">
                        HTTP {execution.httpStatus ?? "—"}
                      </div>

                      <div className="text-sm text-slate-500">
                        {execution.attempts}{" "}
                        {execution.attempts === 1
                          ? "attempt"
                          : "attempts"}
                      </div>

                      <div className="text-sm text-slate-400">
                        {execution.createdAt.toLocaleString()}
                      </div>

                      {execution.status === "failed" && (
                        <RetryButton
                          executionId={execution.id}
                        />
                      )}
                    </div>
                  </div>

                  {/* Payload */}
                  <details className="mt-5">
                    <summary className="cursor-pointer select-none text-sm font-medium text-indigo-600 transition hover:text-indigo-700">
                      View payload
                    </summary>

                    <pre className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
                      {JSON.stringify(
                        execution.payload,
                        null,
                        2
                      )}
                    </pre>
                  </details>

                  {/* Destination response */}
                  {execution.response !== null && (
                    <details className="mt-3">
                      <summary className="cursor-pointer select-none text-sm font-medium text-slate-600 transition hover:text-slate-900">
                        View response
                      </summary>

                      <pre className="mt-3 max-h-96 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
                        {JSON.stringify(
                          execution.response,
                          null,
                          2
                        )}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </p>

      {children}
    </div>
  );
}

function ExecutionIcon({
  status,
}: {
  status: string;
}) {
  if (status === "success") {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50">
        <CircleX className="h-5 w-5 text-red-500" />
      </div>
    );
  }

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50">
      <Clock3 className="h-5 w-5 text-amber-500" />
    </div>
  );
}