# ShardUp Platform

## Core Objective

Create a central platform for the ShardUp community where members can:

- Discover people
- Showcase their work
- Access resources
- Participate in programs
- Stay engaged through community-driven interactions

## Phase 1 - MVP

### 1. Authentication & Roles

Email-based Sign Up / Login with user roles:

- Member
- Admin

Future use cases:
- Event access control
- Hackathon registrations
- Mock interviews
- Exclusive resources

### 2. Member Directory

Each member gets a profile containing:

- Name
- Batch / Branch
- Skills
- Social Links
- Current Projects
- Achievements

Purpose:
- Help members discover and connect with builders in the community
- Make ongoing work visible

### 3. Bookshelf

Community-curated repository of learning resources:

- Books
- Articles
- Courses
- Learning Resources

Categories:
- Development
- Competitive Programming
- AI/ML
- System Design
- Startups
- Productivity

### 4. Session Notes Repository

Central archive for:

- Session Notes
- Workshop Materials
- Speaker Resources
- Recordings & References

Purpose:
- Preserve community knowledge
- Help new members onboard faster

### 5. Achievements Wall

Showcase:

- Internal competition winners
- Hackathon achievements
- Open-source contributions
- Community milestones

Purpose:
- Recognition and motivation
- Visibility for members

### 6. Nudge System

Members can challenge or nudge other members.

Examples:
- "Solve this LeetCode problem"
- "Complete this challenge"
- "Read this article"

Flow:
- User A sends a Nudge
- User B accepts
- On completion the nudge is removed and User B's solved count increments

Nudges are ephemeral: completing, declining, or cancelling a nudge deletes it. A global Nudge scoreboard in the nudges section ranks members by the number of nudges they have solved (completed as the recipient).

Purpose:
- Increase participation
- Create accountability
- Bring group-chat interactions onto the platform

### 7. ShardUp Application Portal

Application form for:

- New Cohorts
- Recruitment Cycles
- Internal Programs

Admin Features:
- Review Applications
- Accept / Reject
- Track Status

## Phase 2 - Future

Competitive Programming Portal:

- 1v1 Duels
- Mock Contests
- Leaderboards
- Challenge Creation
- Internal Rating System

Note: High development effort and not required for MVP validation.

## Local Development

### Auth and Database Setup

The app uses Auth.js with Google OAuth, Prisma, and Postgres for the authentication and registration foundation.

**1. Start a local Postgres** (runs in Docker — requires Docker Desktop):

```bash
docker compose up -d        # start Postgres on localhost:5432
docker compose down         # stop it (data is preserved)
docker compose down -v      # stop it and wipe all data
```

**2. Configure environment variables.** Copy `.env.example` and fill it in:

- `DATABASE_URL` goes in `.env` (the Prisma CLI only reads `.env`).
- Everything else (`AUTH_*`, `ADMIN_EMAILS`, `LOCAL_DEV_AUTH_ENABLED`) goes in `.env.local`.

**3. Create the schema and start the app:**

```bash
npm run prisma:migrate      # apply migrations to the local database
npm run dev
```

### Sign-in

Google OAuth is the real sign-in method. Callback URLs:

- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://YOUR_DOMAIN/api/auth/callback/google`

For local development, Google credentials are optional. Set `LOCAL_DEV_AUTH_ENABLED=true` in `.env.local` and the `/join` page shows two development-only sign-ins:

- **Continue as applicant (dev)** — signs in as `applicant@shardup.local` to test the application flow. This is a throwaway test account: it is reset to `PENDING` with a fresh blank application on every login, so you can re-run the flow repeatedly.
- **Continue as admin (dev)** — signs in as `admin@shardup.local` to test application review. Make sure `admin@shardup.local` is in `ADMIN_EMAILS`.

### Useful commands

- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:seed`
- `npm run prisma:studio`
- `npm run dev`
- `npm run build`

Events are published manually for now. Seed sample events with `npm run prisma:seed`, or manage rows directly in Prisma Studio. Add an optional `imageUrl` to show an event image on the list and detail pages. RSVP is available only to active members; signed-out users can view events but must sign in before RSVPing.

Practice problems are also seed-managed for now. `npm run prisma:seed` publishes the sample `Sum Two Numbers` problem with sample and hidden test cases. Anyone can view problems; only active members can submit solutions.

Practice problems are also seed-managed for now. `npm run prisma:seed` publishes the sample `Sum Two Numbers` problem with sample and hidden test cases. Anyone can view problems; only active members can submit solutions.

### Coding contests

ShardUp runs community coding contests on a roughly biweekly cadence. Admins create contests at `/admin/contests`, attach unpublished problems, publish the contest, and finalize ratings after it ends. Contest submissions reuse the same self-hosted Piston judge as practice.

- Members register on `/contests` and solve problems during the live window.
- Standings use LeetCode-style scoring (solved count, then time taken plus a 5-minute penalty per wrong submission on solved problems).
- Finalize recomputes Codeforces-style contest ratings (default 1500) and auto-assigns rating-tier badges on member profiles.

After deploying contest schema changes, run `npm run prisma:migrate` against your database before publishing a contest.

### Self-hosted Piston judge

ShardUp does not use the public Piston API. Host your own Piston API and point the app at it with `JUDGE_BASE_URL`.

For local development, either:

- Set `JUDGE_PROVIDER=fake` to use the deterministic fake judge used by E2E tests.
- Or run a self-hosted Piston instance and set `JUDGE_BASE_URL=http://localhost:2000/api/v2` (replace the host with your deployment).

Production should set:

- `JUDGE_BASE_URL` — base URL for the self-hosted Piston API, ending at `/api/v2`.
- `JUDGE_API_KEY` — shared secret enforced by your reverse proxy before requests reach Piston.
- `PISTON_PYTHON_VERSION` — optional override, defaults to `3.10.0`.
- `PISTON_CPP_VERSION` — optional override, defaults to `10.2.0`.

Do not set `JUDGE_PROVIDER=fake` in production.

Recommended hosting options:

- Oracle Cloud Always Free VM — best $0 option. Run Docker + Piston on Ubuntu, put Caddy/nginx in front, and require `Authorization: Bearer <JUDGE_API_KEY>`. See `docs/oracle-piston.md` and `infra/oracle-piston-cloud-init.yaml`.
- Tiny paid VM — Hetzner, DigitalOcean, Fly.io, Railway, or Render. Expect roughly $4-7/month, lower setup risk than free tiers.
- Avoid serverless-only hosts for Piston. The judge needs a persistent Linux/container environment, installed runtimes, and strict resource limits.

## Testing

Regression tests guard the design language, page features, and code health. If these pass, your change is safe to merge. The same checks run in CI on every pull request (`.github/workflows/ci.yml`).

Run the full local gate:

```bash
npm run format:check   # Prettier formatting
npm run lint           # ESLint / Next.js rules
npm run typecheck      # TypeScript (tsc --noEmit)
npm run test:unit      # Vitest unit + component + design-token guards
npm run build          # production build
```

- `npm test` / `npm run test:unit` run the Vitest suite in `tests/unit/` (pure logic in `lib/`, the `RsvpControl` / `SiteHeader` / `AccountBar` components, and a design-language guard over `app/globals.css`).
- `npm run test:watch` re-runs unit tests on change.
- `npm run format` auto-fixes formatting.

### End-to-end tests

Playwright drives the real app in `tests/e2e/` (auth-aware navigation, events + RSVP gating, practice submissions, route redirects, the health endpoint). It uses the development-only sign-in and `JUDGE_PROVIDER=fake`, so it requires a Postgres database and runs the dev server automatically.

```bash
# One-time: install the browser
npx playwright install chromium

# Requires a running Postgres. Point DATABASE_URL at a test database.
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shardup?schema=public" npm run test:e2e
```

`global-setup` applies migrations and seeds a deterministic, always-future event before the suite runs. `npm run test:e2e:ui` opens the Playwright UI runner.

End-to-end runs in CI against a Postgres service container. Visual-regression and Lighthouse performance suites are added in follow-up PRs.

### CI and branch protection

Every pull request runs the `verify` job (prettier, lint, typecheck, unit tests, build) and the `e2e` job (Playwright against a Postgres service). Superseded runs on the same branch are auto-cancelled via a workflow `concurrency` group.

To make a green suite required before merging, branch protection on `main` is enabled (required status checks for both CI jobs, enforced for admins). It was applied with:

```bash
gh api -X PUT repos/codenamed22/Agora/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["Static checks & unit tests", "End-to-end tests"] },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null
}
JSON
```

With this, `main` cannot be pushed to or merged into unless both CI jobs pass.

## Deployment to Vercel

This is a Next.js app that deploys directly to Vercel.

### Required Vercel project settings

1. **Framework preset:** Next.js
2. **Build command:** `prisma generate && next build`
3. **Install command:** `npm install`
4. **Environment variables:** Add these in the Vercel dashboard:

   - `DATABASE_URL` — PostgreSQL connection string (e.g., from Supabase, Neon, or Railway)
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`
   - `AUTH_TRUST_HOST` — `true` for Vercel deployments
   - `AUTH_GOOGLE_ID` — Google OAuth client ID
   - `AUTH_GOOGLE_SECRET` — Google OAuth client secret
   - `AUTH_URL` — `https://YOUR_DOMAIN` (no trailing slash)
   - `ADMIN_EMAILS` — comma-separated admin emails
   - `JUDGE_BASE_URL` — self-hosted Piston base URL, e.g. `https://judge.YOUR_DOMAIN/api/v2`
   - `JUDGE_API_KEY` — bearer token your judge reverse proxy requires
   - `AUTH_DEBUG` — optional temporary value `true` for Auth.js debugging in Vercel logs
   - `NEXT_PUBLIC_` prefix is not needed for any current variable

5. **Google OAuth redirect URI:** Add `https://YOUR_DOMAIN/api/auth/callback/google` to the Google Cloud OAuth client.

### Database migrations

Vercel builds do not automatically apply Prisma migrations. Run migrations from your local machine against the production database:

```bash
DATABASE_URL="postgresql://..." npm run prisma:migrate
```

Or set up a Vercel Deploy Hook / CI step that runs `prisma migrate deploy` after production deploys.

Seed sample events against production only when needed:

```bash
DATABASE_URL="postgresql://..." npm run prisma:seed
```

### Important notes

- The local development-only auth path is disabled in production (`NODE_ENV=production`).
- Make sure your production Postgres provider allows connections from Vercel serverless functions.
- Some providers require a connection pooler URL for serverless environments.
- Make sure the self-hosted Piston API is reachable from Vercel serverless functions and is not the deprecated/public Piston endpoint.
- Do not commit `.env.local` or any real credentials to the repo.
- Visit `/api/health` after deployment to verify required environment variables and database connectivity without exposing secret values.
