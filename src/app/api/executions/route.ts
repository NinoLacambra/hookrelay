import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { executions, relays } from "@/db/schema";
import { getUser } from "@/lib/auth";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const relayIdParam = searchParams.get("relayId");

    // No relayId:
    // return all executions belonging to this user's relays
    if (!relayIdParam) {
      const data = await db
        .select({
          id: executions.id,
          relayId: executions.relayId,
          relayName: relays.name,
          payload: executions.payload,
          response: executions.response,
          httpStatus: executions.httpStatus,
          status: executions.status,
          attempts: executions.attempts,
          createdAt: executions.createdAt,
        })
        .from(executions)
        .innerJoin(
          relays,
          eq(executions.relayId, relays.id)
        )
        .where(eq(relays.userId, user.id))
        .orderBy(desc(executions.createdAt));

      return NextResponse.json(data);
    }

    // Validate relayId
    const relayId = Number(relayIdParam);

    if (
      !Number.isInteger(relayId) ||
      relayId <= 0
    ) {
      return NextResponse.json(
        {
          message: "Invalid relay ID",
        },
        {
          status: 400,
        }
      );
    }

    // Return executions only when the relay
    // belongs to the authenticated user
    const data = await db
      .select({
        id: executions.id,
        relayId: executions.relayId,
        relayName: relays.name,
        payload: executions.payload,
        response: executions.response,
        httpStatus: executions.httpStatus,
        status: executions.status,
        attempts: executions.attempts,
        createdAt: executions.createdAt,
      })
      .from(executions)
      .innerJoin(
        relays,
        eq(executions.relayId, relays.id)
      )
      .where(
        and(
          eq(executions.relayId, relayId),
          eq(relays.userId, user.id)
        )
      )
      .orderBy(desc(executions.createdAt));

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "GET executions error:",
      error
    );

    return NextResponse.json(
      {
        message: "Failed to fetch executions",
      },
      {
        status: 500,
      }
    );
  }
}