# Branch Manager Dashboard Design

Date: 2026-04-17
Project: Room and Lecture Hall Management and Booking System (AASTMT)
Scope owner: Branch Manager dashboard feature only

## 1. Goal and Scope

Implement the Branch Manager feature end-to-end for the current app version, limited to:

1. Final approval queue for multi-purpose bookings that already passed Admin approval.
2. One manager action only: Final Approve.
3. Read-only visibility of the full system schedule via weekly/monthly calendar views.
4. VIP notification emission for Admin after final approval.

## 2. Explicit Decisions (Locked)

The following decisions were confirmed with the product owner:

1. Branch Manager action on pending requests is approve-only.
2. Reject is not included in this implementation.
3. Branch Manager must see the full system schedule in read-only mode.
4. Branch Manager queue includes only requests routed from Admin and awaiting final manager approval.
5. Work is isolated to the Branch Manager feature and must avoid unrelated feature changes.

## 3. Non-Goals

This implementation does not include:

1. Changes to Employee, Secretary, or Admin feature behavior unrelated to manager final approval.
2. Manager-side booking edits.
3. Manager-side rejection workflow.
4. New reporting surfaces beyond manager queue and read-only calendar.

## 4. Existing Codebase Constraints

1. Next.js App Router project.
2. Business logic must live in `src/features/*` (team rule).
3. `src/app/*` routes should stay thin and import feature-layer components/actions/queries.
4. Supabase Auth + Postgres + RLS controls data access.

## 5. High-Level Architecture

### 5.1 Routing and Composition

- Route file: `src/app/(dashboards)/manager/page.tsx`
- Feature root: `src/features/manager-dashboard/`
- Route loads manager-facing data and server actions, then renders manager dashboard UI container.

### 5.2 Feature Layer Responsibilities

1. `queries.ts`
   - Fetch pending final approvals for Branch Manager queue.
   - Fetch full schedule data for read-only calendar views.
2. `actions.ts`
   - Execute final-approve transition atomically.
   - Emit Admin VIP notification record.
3. `ui/*`
   - Render queue tab and read-only calendar tab.
   - Handle optimistic-safe interaction states and user feedback.

### 5.3 UI Structure

Recommended split:

- `ui/manager-dashboard-page.tsx` (shell and tab orchestration)
- `ui/approval-queue.tsx` (pending items + request details dialog + approve action)
- `ui/read-only-calendar.tsx` (weekly/monthly views, no mutation controls)

## 6. Workflow Design

### 6.1 Queue Inclusion Rule

A booking is shown in Branch Manager pending queue if all are true:

1. `room_type = 'multi-purpose'`
2. `status = 'approved'` (Admin already approved)
3. `branch_manager_status = 'pending'`

### 6.2 Final Approval State Transition

On manager click `Final Approve`:

1. Validate current user role is `branch_manager`.
2. Atomically update target booking where current state still matches pending criteria.
3. Set `branch_manager_status = 'approved'`.
4. Keep `status = 'approved'`.
5. Insert VIP notification event for Admin.
6. Revalidate manager route and remove item from pending queue.

### 6.3 Read-Only Visibility

1. Manager can view full booking schedule in weekly and monthly formats.
2. Calendar is non-interactive for mutation (no approve/reject/edit/force-assign).
3. Color coding can mirror existing semantics where data is available.

## 7. Data Model and Schema Notes

### 7.1 Current Required Booking Fields

Manager feature relies on:

- `bookings.room_type`
- `bookings.status`
- `bookings.branch_manager_status`
- `bookings.branch_manager_feedback` (legacy-compatible, not used for approve-only path)

Note: Current repo code already references `branch_manager_status` and `branch_manager_feedback`. If any target environment misses these columns, a migration must be applied before runtime verification.

### 7.2 VIP Notifications

Add a lightweight notification table for Admin-side priority events.

Proposed table: `vip_notifications`

Fields:

1. `id UUID PK`
2. `booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE`
3. `event_type TEXT NOT NULL`
4. `message TEXT NOT NULL`
5. `created_by UUID NOT NULL REFERENCES profiles(id)`
6. `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
7. `is_read BOOLEAN NOT NULL DEFAULT false`

Used event type in this feature:

- `multi_purpose_final_approved_by_branch_manager`

## 8. Access Control and Safety

### 8.1 Page-Level Access

`/manager` must redirect non-authenticated users to `/login` and non-branch-manager users to their proper dashboard.

### 8.2 Action-Level Access

Server action performs role check before mutation, independent from client UI checks.

### 8.3 Concurrency Safety

Final approve action uses conditional update:

- Match by booking id + required current state (`room_type`, `status`, `branch_manager_status`).
- If no rows affected, return deterministic error (`already_processed_or_invalid_state`).

This prevents duplicate final approvals and race-condition inconsistencies.

## 9. UI Behavior Details

### 9.1 Pending Queue Tab

Each item shows:

1. Requester details
2. Room/date/time
3. Purpose
4. Multi-purpose form details (manager name/title/mobile + technical requirements)

Dialog actions:

- Primary: `Final Approve`
- Secondary: `Close`

### 9.2 System Calendar Tab

1. Weekly view: day columns + time slot rows with room occupancy visualization.
2. Monthly view: high-level occupancy overview.
3. Read-only by design.

## 10. Error Handling Contract

Action result shape:

- Success: `{ success: true }`
- Failure: `{ success: false, error: string, code?: string }`

Expected failures:

1. Unauthorized user.
2. Wrong role.
3. Booking not found / already processed.
4. Database mutation error.

UI behavior:

1. Show success/error toast.
2. Do not remove item from queue if action fails.
3. Keep dialog open or provide clear retry path on failure.

## 11. Testing and Verification Plan

Minimum verification for this feature:

1. Queue correctness
   - Only Admin-approved pending multi-purpose records appear.
2. Final approval
   - Approve succeeds, item disappears, state persisted.
3. Concurrency
   - Re-approve same record gracefully fails with stable error.
4. Visibility
   - Manager sees full calendar data in weekly/monthly read-only tabs.
5. Authorization
   - Non-manager user cannot execute manager final-approve action.
6. Notification emission
   - VIP notification row is inserted on each successful manager final approval.

## 12. File-Level Change Plan

Primary files in manager feature boundary:

1. `src/app/(dashboards)/manager/page.tsx` (data/action wiring and role gate)
2. `src/features/manager-dashboard/actions.ts` (approve-only action + VIP emit)
3. `src/features/manager-dashboard/queries.ts` (queue + calendar reads)
4. `src/features/manager-dashboard/ui/manager-dashboard-page.tsx` (tabs and shared shell)
5. `src/features/manager-dashboard/ui/approval-queue.tsx` (new or extracted)
6. `src/features/manager-dashboard/ui/read-only-calendar.tsx` (new or extracted)

Optional DB support artifact (if schema is managed in repo):

7. `supabase_schema.sql` (add missing columns/table if absent in local schema)

## 13. Rollout Notes

1. Implement manager feature in isolation first.
2. Keep Admin-facing VIP display untouched unless explicitly requested.
3. Use existing visual language (AASTMT navy/gold) to avoid style drift.
4. Avoid broad refactors while multiple developers are editing in parallel.
