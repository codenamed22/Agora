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
- Completion gets recorded

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

Required environment variables are listed in `.env.example`.

For local development, Google credentials are optional. Set `LOCAL_DEV_AUTH_ENABLED=true` in `.env.local` to show a development-only local sign-in option. Use `LOCAL_DEV_AUTH_ROLE=admin` to test application review, or `LOCAL_DEV_AUTH_ROLE=member` to test the applicant flow without sharing Google OAuth secrets.

Google OAuth callback URLs:

- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://YOUR_DOMAIN/api/auth/callback/google`

Useful commands:

- `npm run prisma:generate`
- `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shardup?schema=public" npm run prisma:migrate`
- `npm run dev`
- `npm run build`

Registration is application-first. Google sign-in creates the user identity, but member access remains gated until the application is approved by an admin.

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
   - `NEXT_PUBLIC_` prefix is not needed for any current variable

5. **Google OAuth redirect URI:** Add `https://YOUR_DOMAIN/api/auth/callback/google` to the Google Cloud OAuth client.

### Database migrations

Vercel builds do not automatically apply Prisma migrations. Run migrations from your local machine against the production database:

```bash
DATABASE_URL="postgresql://..." npm run prisma:migrate
```

Or set up a Vercel Deploy Hook / CI step that runs `prisma migrate deploy` after production deploys.

### Important notes

- The local development-only auth path is disabled in production (`NODE_ENV=production`).
- Make sure your production Postgres provider allows connections from Vercel serverless functions.
- Some providers require a connection pooler URL for serverless environments.
- Do not commit `.env.local` or any real credentials to the repo.
