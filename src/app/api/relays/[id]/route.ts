import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { relays } from "@/db/schema";
import { getUser } from "@/lib/auth";

const updateRelaySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Relay name is required")
      .max(100)
      .optional(),

    destinationUrl: z
      .string()
      .trim()
      .url("Enter a valid destination URL")
      .optional(),

    active: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.destinationUrl !== undefined ||
      data.active !== undefined,
    {
      message: "No changes provided",
    }
  );

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    // Check authentication
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
    const relayId = Number(id);

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

    const body = await request.json();

    const result =
      updateRelaySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Invalid relay data",
          errors: result.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    // Update only if this relay belongs
    // to the authenticated user
    const [updatedRelay] = await db
      .update(relays)
      .set(result.data)
      .where(
        and(
          eq(relays.id, relayId),
          eq(relays.userId, user.id)
        )
      )
      .returning();

    if (!updatedRelay) {
      return NextResponse.json(
        {
          message: "Relay not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      message: "Relay updated",
      relay: updatedRelay,
    });
  } catch (error) {
    console.error(
      "PATCH relay error:",
      error
    );

    return NextResponse.json(
      {
        message: "Failed to update relay",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    // Check authentication
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
    const relayId = Number(id);

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

    // Delete only if this relay belongs
    // to the authenticated user
    const [deletedRelay] = await db
      .delete(relays)
      .where(
        and(
          eq(relays.id, relayId),
          eq(relays.userId, user.id)
        )
      )
      .returning();

    if (!deletedRelay) {
      return NextResponse.json(
        {
          message: "Relay not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      message: "Relay deleted",
    });
  } catch (error) {
    console.error(
      "DELETE relay error:",
      error
    );

    return NextResponse.json(
      {
        message: "Failed to delete relay",
      },
      {
        status: 500,
      }
    );
  }
}