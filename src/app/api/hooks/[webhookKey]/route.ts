import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { executions, relays } from "@/db/schema";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ webhookKey: string }>;
  }
) {
  const { webhookKey } = await context.params;

  try {
    // Find the relay
    const [relay] = await db
      .select()
      .from(relays)
      .where(eq(relays.webhookKey, webhookKey))
      .limit(1);

    if (!relay) {
      return NextResponse.json(
        { message: "Relay not found" },
        { status: 404 }
      );
    }

    if (!relay.active) {
      return NextResponse.json(
        { message: "Relay is inactive" },
        { status: 403 }
      );
    }

    // Read incoming webhook payload
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Create pending execution
    const [execution] = await db
      .insert(executions)
      .values({
        relayId: relay.id,
        payload,
        status: "pending",
        attempts: 1,
      })
      .returning();

    try {
      // Forward payload
      const response = await fetch(relay.destinationUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "HookRelay/1.0",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      let responseBody: unknown;

      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = {
          body: responseText,
        };
      }

      const status = response.ok ? "success" : "failed";

      await db
        .update(executions)
        .set({
          response: responseBody,
          httpStatus: response.status,
          status,
        })
        .where(eq(executions.id, execution.id));

      return NextResponse.json({
        message: response.ok
          ? "Webhook forwarded successfully"
          : "Destination returned an error",
        executionId: execution.id,
        status,
        destinationStatus: response.status,
      });
    } catch (error) {
      console.error("Webhook forwarding error:", error);

      await db
        .update(executions)
        .set({
          response: {
            error:
              error instanceof Error
                ? error.message
                : "Unknown forwarding error",
          },
          status: "failed",
        })
        .where(eq(executions.id, execution.id));

      return NextResponse.json(
        {
          message: "Failed to forward webhook",
          executionId: execution.id,
          status: "failed",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("HookRelay webhook error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}