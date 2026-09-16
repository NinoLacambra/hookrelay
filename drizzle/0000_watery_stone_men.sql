CREATE SCHEMA "hookrelay";
--> statement-breakpoint
CREATE TABLE "hookrelay"."executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"relay_id" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"response" jsonb,
	"http_status" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hookrelay"."relays" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"webhook_key" text NOT NULL,
	"destination_url" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "relays_webhook_key_unique" UNIQUE("webhook_key")
);
--> statement-breakpoint
ALTER TABLE "hookrelay"."executions" ADD CONSTRAINT "executions_relay_id_relays_id_fk" FOREIGN KEY ("relay_id") REFERENCES "hookrelay"."relays"("id") ON DELETE cascade ON UPDATE no action;