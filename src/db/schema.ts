import {
  boolean,
  integer,
  jsonb,
  pgSchema,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const hookrelay = pgSchema("hookrelay");

export const relays = hookrelay.table("relays", {
  id: serial("id").primaryKey(),

  userId: text("user_id"),

  name: text("name").notNull(),

  webhookKey: text("webhook_key")
    .notNull()
    .unique(),

  destinationUrl: text("destination_url").notNull(),

  active: boolean("active")
    .notNull()
    .default(true),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

export const executions = hookrelay.table("executions", {
  id: serial("id").primaryKey(),

  relayId: integer("relay_id")
    .references(() => relays.id, {
      onDelete: "cascade",
    })
    .notNull(),

  payload: jsonb("payload").notNull(),

  response: jsonb("response"),

  httpStatus: integer("http_status"),

  status: text("status")
    .notNull()
    .default("pending"),

  attempts: integer("attempts")
    .notNull()
    .default(0),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});