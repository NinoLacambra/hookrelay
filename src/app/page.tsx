import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Radio,
  Webhook,
  XCircle,
} from "lucide-react";

import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { executions, relays } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Require authentication and get the current Supabase user
  const user = await requireUser();

  // Only fetch relays owned by the current user
  const relayList = await db
    .select()
    .from(relays)
    .where(eq(relays.userId, user.id))
    .orderBy(desc(relays.createdAt));

  // Only fetch executions belonging to the current user's relays
  const executionList = await db
    .select({
      id: executions.id,
      relayName: relays.name,
      status: executions.status,
      httpStatus: executions.httpStatus,
      attempts: executions.attempts,
      createdAt: executions.createdAt,
    })
    .from(executions)
    .innerJoin(
      relays,
      eq(executions.relayId, relays.id)
    )
    .where(eq(relays.userId, user.id))
    .orderBy(desc(executions.createdAt))
    .limit(10);

  // Dashboard statistics scoped to the current user
  const [stats] = await db
    .select({
      executions: sql<number>`
        count(*)::int
      `,
      successful: sql<number>`
        count(*) filter (
          where ${executions.status} = 'success'
        )::int
      `,
      failed: sql<number>`
        count(*) filter (
          where ${executions.status} = 'failed'
        )::int
      `,
    })
    .from(executions)
    .innerJoin(
      relays,
      eq(executions.relayId, relays.id)
    )
    .where(eq(relays.userId, user.id));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <header className="flex flex-col gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-600">
              <Webhook className="h-5 w-5" />

              <span className="text-sm font-semibold">
                HookRelay
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Webhook Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Forward, monitor, and debug your webhook events.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <LogoutButton />

            <Link
              href="/relays/new"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Create Relay
            </Link>
          </div>
        </header>

        {/* Stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Relays"
            value={relayList.length}
            icon={
              <Radio className="h-5 w-5" />
            }
          />

          <StatCard
            title="Executions"
            value={stats?.executions ?? 0}
            icon={
              <Activity className="h-5 w-5" />
            }
          />

          <StatCard
            title="Successful"
            value={stats?.successful ?? 0}
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
          />

          <StatCard
            title="Failed"
            value={stats?.failed ?? 0}
            icon={
              <XCircle className="h-5 w-5" />
            }
          />
        </section>

        {/* Relays */}
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Relays
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your configured webhook forwarding endpoints.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {relayList.length === 0 ? (
              <div className="p-8 text-sm text-slate-500">
                No relays yet.
              </div>
            ) : (
              relayList.map((relay) => (
                <Link
                  key={relay.id}
                  href={`/relays/${relay.id}`}
                  className="flex flex-col gap-4 border-b border-slate-100 p-5 transition last:border-0 hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          relay.active
                            ? "bg-emerald-500"
                            : "bg-slate-300"
                        }`}
                      />

                      <p className="font-medium">
                        {relay.name}
                      </p>
                    </div>

                    <p className="mt-2 max-w-xl truncate text-sm text-slate-500">
                      {relay.destinationUrl}
                    </p>
                  </div>

                  <code className="max-w-sm truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    /api/hooks/{relay.webhookKey}
                  </code>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Recent Executions */}
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Recent Executions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Latest webhook delivery attempts.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {executionList.length === 0 ? (
              <div className="p-8 text-sm text-slate-500">
                No executions yet.
              </div>
            ) : (
              executionList.map(
                (execution) => (
                  <div
                    key={execution.id}
                    className="grid gap-3 border-b border-slate-100 p-5 last:border-0 md:grid-cols-[1fr_120px_100px_180px] md:items-center"
                  >
                    <div>
                      <p className="font-medium">
                        {execution.relayName}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Execution #{execution.id}
                      </p>
                    </div>

                    <StatusBadge
                      status={execution.status}
                    />

                    <span className="text-sm text-slate-600">
                      HTTP{" "}
                      {execution.httpStatus ??
                        "—"}
                    </span>

                    <span className="text-sm text-slate-500">
                      {execution.createdAt.toLocaleString()}
                    </span>
                  </div>
                )
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between text-slate-500">
        <p className="text-sm">
          {title}
        </p>

        <div className="rounded-lg bg-slate-100 p-2">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-3xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles =
    status === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
      : status === "failed"
        ? "bg-red-50 text-red-700 ring-red-600/20"
        : "bg-amber-50 text-amber-700 ring-amber-600/20";

  return (
    <span
      className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${styles}`}
    >
      {status}
    </span>
  );
}