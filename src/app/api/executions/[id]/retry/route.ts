import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { executions, relays } from "@/db/schema";
import { getUser } from "@/lib/auth";

export async function POST(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // Require authentication
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;
    const executionId = Number(id);

    if (
      !Number.isInteger(executionId) ||
      executionId <= 0
    ) {
      return NextResponse.json(
        {
          message: "Invalid execution ID",
        },
        {
          status: 400,
        }
      );
    }

    // Find the execution together with its relay,
    // and verify that the relay belongs to this user.
    const [result] = await db
      .select({
        execution: executions,
        relay: relays,
      })
      .from(executions)
      .innerJoin(
        relays,
        eq(executions.relayId, relays.id)
      )
      .where(
        and(
          eq(executions.id, executionId),
          eq(relays.userId, user.id)
        )
      )
      .limit(1);

    if (!result) {
      return NextResponse.json(
        {
          message: "Execution not found",
        },
        {
          status: 404,
        }
      );
    }

    const execution = result.execution;
    const relay = result.relay;

    // Only failed executions can be retried
    if (execution.status !== "failed") {
      return NextResponse.json(
        {
          message:
            "Only failed executions can be retried",
        },
        {
          status: 400,
        }
      );
    }

    // Don't retry through an inactive relay
    if (!relay.active) {
      return NextResponse.json(
        {
          message: "Relay is inactive",
        },
        {
          status: 403,
        }
      );
    }

    const attempts =
      execution.attempts + 1;

    try {
      const response = await fetch(
        relay.destinationUrl,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            "User-Agent":
              "HookRelay/1.0",
          },
          body: JSON.stringify(
            execution.payload
          ),
        }
      );

      const responseText =
        await response.text();

      let responseBody: unknown;

      try {
        responseBody =
          JSON.parse(responseText);
      } catch {
        responseBody = {
          body: responseText,
        };
      }

      const status = response.ok
        ? "success"
        : "failed";

      const [updatedExecution] =
        await db
          .update(executions)
          .set({
            response: responseBody,
            httpStatus: response.status,
            status,
            attempts,
          })
          .where(
            eq(
              executions.id,
              execution.id
            )
          )
          .returning();

      return NextResponse.json({
        message: response.ok
          ? "Execution retried successfully"
          : "Retry failed",
        execution: updatedExecution,
      });
    } catch (error) {
      console.error(
        "Retry forwarding error:",
        error
      );

      const [updatedExecution] =
        await db
          .update(executions)
          .set({
            response: {
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown forwarding error",
            },
            httpStatus: null,
            status: "failed",
            attempts,
          })
          .where(
            eq(
              executions.id,
              execution.id
            )
          )
          .returning();

      return NextResponse.json(
        {
          message: "Retry failed",
          execution:
            updatedExecution,
        },
        {
          status: 502,
        }
      );
    }
  } catch (error) {
    console.error(
      "Retry execution error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to retry execution",
      },
      {
        status: 500,
      }
    );
  }
}