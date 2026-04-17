# Project Overview
**Name:** Room and Lecture Hall Management System (AASTMT)
**Goal:** 24-hour hackathon project to build a full-stack Next.js app managing room bookings.
**Tech Stack:** Next.js (App Router), Supabase (Auth & Postgres DB), TailwindCSS, Shadcn UI.
**Theme:** AASTMT Corporate Colors (Navy Blue, Gold/Yellow, White).

## ⚠️ Team Collaboration & Git Conflict Avoidance (CRITICAL)
Two developers are working simultaneously. To prevent merge conflicts, we are strictly using a **Feature-Based Folder Structure**. 

**Rule:** NEVER write business logic in the global `app/` directory. The `app/` directory should ONLY contain route definitions that import components from the `src/features/` directory.

### Directory Structure:
```text
src/
 ├── app/                  # ONLY Next.js routing (page.tsx, layout.tsx)
 ├── components/           # ONLY global shared UI (Shadcn components, layout headers)
 ├── lib/                  # Global utils (Supabase client, Tailwind cn)
 └── features/             # ALL business logic lives here
      ├── auth/            # Assigned to Dev A
      ├── bookings/        # Assigned to Dev B
      ├── rooms/
      └── admin-dashboard/

Anatomy of a Feature Folder (e.g., src/features/bookings/):
/ui - React components specific to this feature.

/actions.ts - Next.js Server Actions for data mutation (POST/PUT/DELETE).

/queries.ts - Data fetching functions (GET).

/schema.ts - Zod validation schemas.

When generating code, always specify exactly which feature folder the file belongs to.

Core Business Logic & RBAC
There are four primary roles. Authentication is handled via Supabase using (Employee ID, Password).

Admin (Room Manager): God mode. Can view all schedules, override rules, change rooms instantly (bypassing time limits), and approve standard exceptional bookings.

Branch Manager: Only handles the final approval for "Multi-Purpose" rooms. Modifying a booking triggers a notification to Admin.

Employee (Doctor): Can request Lecture Rooms (24h minimum notice) & Multi-Purpose Rooms. Cannot see the schedule/availability by default (blind booking).

Secretary: Can ONLY request Multi-Purpose Rooms (48h minimum notice). Cannot see availability.

Booking Workflow
User (Doctor/Secretary) submits a blind request.

If Room is occupied -> Admin rejects, provides reason, and suggests alternative time/room.

If Room is Multi-Purpose -> Admin approves -> routes to Branch Manager for final approval.
