# HookRelay

A lightweight webhook automation platform for receiving, forwarding, monitoring, and retrying webhook events.

HookRelay provides developers with unique webhook endpoints that receive JSON payloads, forward them to configured destinations, and record execution results for debugging and monitoring.

## Live Demo

https://hook-relays.netlify.app/

## Features

- Email/password authentication with Supabase Auth
- Per-user relay ownership
- Unique webhook endpoint generation
- Public webhook receiver endpoints
- JSON payload forwarding
- Execution history and monitoring
- HTTP response/status tracking
- Failed delivery detection
- Manual retry for failed executions
- Retry attempt tracking
- Activate/deactivate relays
- Edit relay configuration
- Delete relays and execution history
- Copyable production webhook URLs
- User-scoped dashboard statistics
- Protected management APIs
- Responsive light developer-tool interface

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- PostgreSQL
- Supabase
- Supabase Auth
- Drizzle ORM
- Zod
- Lucide React
- Netlify

## How It Works

```text
External Service
      |
      | POST JSON
      v
+----------------------+
| HookRelay Webhook    |
| /api/hooks/:key      |
+----------------------+
      |
      | Create execution
      v
+----------------------+
| PostgreSQL           |
| Execution Log        |
+----------------------+
      |
      | Forward JSON
      v
+----------------------+
| Destination API      |
+----------------------+
      |
      | HTTP response
      v
+----------------------+
| HookRelay            |
| success / failed     |
+----------------------+
```

Each relay receives a unique webhook key.

Example:

```text
https://hook-relays.netlify.app/api/hooks/YOUR_WEBHOOK_KEY
```

External applications can send JSON to this endpoint without authenticating with HookRelay.

Authentication is required to create, view, edit, delete, activate, deactivate, and retry relays and executions.

## Authentication & Ownership

HookRelay uses Supabase Auth for email/password authentication.

Each relay stores the ID of the Supabase user who created it:

```text
Supabase User
     |
     +---- Relay
     |       |
     |       +---- Execution
     |       +---- Execution
     |       +---- Execution
     |
     +---- Relay
             |
             +---- Execution
```

Dashboard queries and management APIs are scoped to the authenticated user.

A user cannot access another user's relay by manually changing the relay ID in the URL or calling the management API directly.

Public webhook endpoints remain unauthenticated by design so external services can trigger them.

## Database

HookRelay uses a dedicated PostgreSQL schema:

```text
hookrelay
```

### `relays`

Stores webhook forwarding configurations.

```text
id
user_id
name
webhook_key
destination_url
active
created_at
```

### `executions`

Stores webhook delivery attempts.

```text
id
relay_id
payload
response
http_status
status
attempts
created_at
```

Execution statuses include:

```text
pending
success
failed
```

Deleting a relay also deletes its associated execution history through a cascading foreign key.

## API Routes

### Relays

```text
GET    /api/relays
POST   /api/relays
PATCH  /api/relays/:id
DELETE /api/relays/:id
```

Relay management endpoints require authentication and enforce relay ownership.

### Webhook Receiver

```text
POST /api/hooks/:webhookKey
```

Receives a JSON payload and forwards it to the relay's configured destination.

This endpoint is intentionally public.

### Executions

```text
GET  /api/executions
GET  /api/executions?relayId=:id
POST /api/executions/:id/retry
```

Execution management endpoints require authentication and are scoped to relays owned by the current user.

## Example Webhook

Send a webhook to a HookRelay endpoint:

```bash
curl -X POST \
  https://hook-relays.netlify.app/api/hooks/YOUR_WEBHOOK_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order.created",
    "orderId": "ORD-PROD-1001",
    "customer": "Nino",
    "amount": 1500,
    "environment": "production"
  }'
```

A successful delivery returns:

```json
{
  "message": "Webhook forwarded successfully",
  "executionId": 6,
  "status": "success",
  "destinationStatus": 200
}
```

HookRelay stores the incoming payload, destination response, HTTP status, execution status, and attempt count.

## Failed Deliveries & Retries

When the destination cannot be reached or returns an unsuccessful HTTP response, HookRelay marks the execution as:

```text
failed
```

The execution can then be retried from the dashboard.

Each retry:

1. Uses the original webhook payload
2. Sends it to the relay's current destination
3. Records the destination response
4. Updates the HTTP status
5. Updates the execution status
6. Increments the attempt count

Retries are only allowed for executions belonging to relays owned by the authenticated user.

## Local Development

Clone the repository:

```bash
git clone git@github.com:NinoLacambra/hookrelay.git
cd hookrelay
```

Install dependencies:

```bash
npm install
```

Create:

```text
.env.local
```

Add:

```env
DATABASE_URL="your-postgresql-connection-string"

NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"
```

Never commit `.env.local` or production credentials to Git.

Generate migrations when the database schema changes:

```bash
npx drizzle-kit generate
```

Run migrations:

```bash
npx drizzle-kit migrate
```

Start development:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Production Build

Run:

```bash
npm run build
```

HookRelay is deployed on Netlify.

Production environment variables must be configured in the deployment environment rather than committed to the repository.

## Production Validation

The production webhook flow has been tested end-to-end:

```text
External POST
     ↓
HookRelay on Netlify
     ↓
Webhook received
     ↓
Execution created
     ↓
Payload forwarded
     ↓
Destination HTTP 200
     ↓
Execution marked success
```

## Project Purpose

HookRelay was built as a portfolio project to demonstrate full-stack engineering concepts including:

- Authentication and authorization
- Multi-user data ownership
- PostgreSQL relational modeling
- Webhook infrastructure
- Third-party API communication
- Execution logging
- Failure handling
- Retry workflows
- REST API design
- Server-side security
- Production deployment

## Author

**Nino Lacambra**

Full-Stack Engineer

GitHub: https://github.com/NinoLacambra