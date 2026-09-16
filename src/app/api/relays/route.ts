import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

import { db } from "@/db";
import { relays } from "@/db/schema";
import { getUser } from "@/lib/auth";

const relaySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Relay name is required")
    .max(100),

  destinationUrl: z
    .string()
    .trim()
    .url("Enter a valid destination URL"),
});

export async function GET() {
  try {
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

    const data = await db
      .select()
      .from(relays)
      .where(eq(relays.userId, user.id))
      .orderBy(desc(relays.createdAt));

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET relays error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch relays",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    const body = await request.json();

    const result = relaySchema.safeParse(body);

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

    const webhookKey = crypto
      .randomBytes(24)
      .toString("hex");

    const [relay] = await db
      .insert(relays)
      .values({
        userId: user.id,
        name: result.data.name,
        destinationUrl:
          result.data.destinationUrl,
        webhookKey,
      })
      .returning();

    return NextResponse.json(
      relay,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("POST relay error:", error);

    return NextResponse.json(
      {
        message: "Failed to create relay",
      },
      {
        status: 500,
      }
    );
  }
}