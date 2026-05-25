# Access Control Data Connectivity Plan

## Status

- [x] Critical bug fixed: `access_badges` → `badges` table reference
- [ ] Schema alignment needed
- [ ] Server actions needed
- [ ] Component data binding needed

## Critical Bug Fix (Completed)

**File**: `apps/portal/app/(departments)/access-control/page.tsx:25`

- Changed `access_badges` → `badges`
- Changed `status = 'active'` → `is_active = true`
- Removed `department_id` filter (badges table lacks this column)

## Schema Gaps Identified

### 1. Badges Table Missing Department Link

**Location**: `packages/database/migrations/028_access_control_system.sql`
**Issue**: `badges` table has no `department_id` column. Cannot filter badges by department for the dashboard.
**Options**:

- a) Add `department_id` to badges table (denormalized, fast queries)
- b) Join through `personnel.department_id` or `visitors` (normalized, complex queries)
- c) Use service-role client for admin dashboard queries that bypass RLS

**Recommendation**: Option (a) - Add `department_id` to badges. The access control dashboard is department-scoped and this is the most performant approach.

### 2. Badges Table Missing Fleet/Equipment Foreign Keys

**Location**: `packages/database/migrations/028_access_control_system.sql`
**Issue**: `entity_type` includes `'vehicle'`, but badges only has `personnel_id` and `visitor_id` columns.
**Fix**: Add `fleet_id` and `equipment_id` columns to badges table.

### 3. Missing expires_at Column (Partially Fixed)

**Location**: `packages/database/migrations/040_access_control_production_fixes.sql`
**Status**: `expires_at` column added to badges table in migration 040.
**Note**: Need to verify this migration is synced to `packages/supabase/migrations/`.

## Required Server Actions

### 1. `getAccessControlMetrics(deptId: string)`

**Purpose**: KPI data for DashboardKPIGrid
**Returns**:

```typescript
{
  activeQrCodes: number;
  expiringSoon: number; // expires_at within 7 days
  deniedToday: number; // access_logs today, access_granted = false
  accessEventsToday: number; // access_logs today
  expiredAssigned: number; // is_active = true but expires_at < now
  entityCoverage: number; // % of entities with active badges
}
```

### 2. `getRecentAccessActivity(deptId: string, limit: number)`

**Purpose**: Feed data for DashboardActivityFeed
**Returns**: Array of access log entries with entity name resolution

### 3. `getEntityBadgeStatus(deptId: string)`

**Purpose**: Entity breakdown for DashboardEntityStatus
**Returns**: Counts per entity type (personnel, fleet, equipment) with active/expiring/expired breakdown

### 4. `getHourlyAccessStats(date: string)`

**Purpose**: Chart data for HourlyAccessChart
**Returns**: Hourly aggregation of granted/denied access events

### 5. `getBadgeStatusDistribution()`

**Purpose**: Chart data for QRStatusDistributionChart
**Returns**: Counts by status (active, expiring soon, expired, revoked)

## Required API Routes

### `/api/access-control/scan` (Already exists: `/api/c66`)

**Status**: ✅ Hardware scanner endpoint exists and works
**Gap**: Needs rate limiting and duplicate scan prevention

## Component Integration Plan

### Phase 1: Server Actions (Foundation)

1. Create `apps/portal/app/(departments)/access-control/actions.ts`
2. Implement `getAccessControlMetrics()`
3. Implement `getRecentAccessActivity()`
4. Implement `getEntityBadgeStatus()`
5. Implement `getHourlyAccessStats()`
6. Implement `getBadgeStatusDistribution()`

### Phase 2: Page-Level Data Fetching

1. Update `access-control/page.tsx` to call server actions
2. Pass fetched data as props to dashboard components
3. Add `suspense` boundaries with skeleton loaders

### Phase 3: Component Refactoring

1. **DashboardKPIGrid**: Accept `metrics` prop, remove static `kpiData`
2. **DashboardActivityFeed**: Accept `activity` prop, remove static `recentActivity`
3. **DashboardEntityStatus**: Accept `entityStatus` prop, remove static `entityRows`
4. **HourlyAccessChart**: Accept `hourlyData` prop, remove static data
5. **QRStatusDistributionChart**: Accept `distribution` prop, remove static data

### Phase 4: Sub-Pages

1. **badges/page.tsx**: Connect to `badges` table with personnel/visitor/fleet joins
2. **visitors/page.tsx**: Connect to `visitors` table with host personnel join
3. **access-logs/page.tsx**: Connect to `access_logs` table with badge/entity joins

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  access-control/page.tsx (Server Component)                  │
│  ├─ getDepartmentContext()                                  │
│  ├─ getAccessControlMetrics(deptId)    → DashboardKPIGrid     │
│  ├─ getRecentAccessActivity(deptId)    → DashboardActivityFeed│
│  ├─ getEntityBadgeStatus(deptId)       → DashboardEntityStatus│
│  ├─ getHourlyAccessStats(today)        → HourlyAccessChart    │
│  └─ getBadgeStatusDistribution()       → QRStatusDistribution │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Server Actions (access-control/actions.ts)                   │
│  ├─ Queries badges, access_logs, personnel, visitors, fleet │
│  └─ Uses createServerSupabaseClient() with RLS              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase (RLS Policies)                                    │
│  ├─ badges: read by access_control, admin roles            │
│  ├─ access_logs: read by access_control, admin roles        │
│  └─ personnel/visitors/fleet: read by same roles             │
└─────────────────────────────────────────────────────────────┘
```

## Migration Requirements

### Migration 044: Access Control Dashboard Schema Updates

```sql
-- Add department_id to badges for fast department-scoped queries
ALTER TABLE badges ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id);

-- Add fleet_id and equipment_id to badges for complete entity coverage
ALTER TABLE badges ADD COLUMN IF NOT EXISTS fleet_id uuid REFERENCES fleet(id);
ALTER TABLE badges ADD COLUMN IF NOT EXISTS equipment_id uuid REFERENCES equipment(id);

-- Index for department-scoped badge queries
CREATE INDEX idx_badges_department_id ON badges(department_id);
CREATE INDEX idx_badges_fleet_id ON badges(fleet_id);
CREATE INDEX idx_badges_equipment_id ON badges(equipment_id);

-- Index for expiring badge queries
CREATE INDEX idx_badges_expires_at ON badges(expires_at) WHERE is_active = true;

-- Add department_id to access_logs for fast department filtering
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id);
CREATE INDEX idx_access_logs_department_id ON access_logs(department_id);
```

## Implementation Order

1. **Create migration 044** (schema updates)
2. **Create server actions** (`actions.ts`)
3. **Update page.tsx** to fetch real data
4. **Refactor components** to accept props
5. **Connect sub-pages** (badges, visitors, access-logs)
6. **Run full test suite** (unit + e2e)
7. **Performance test** dashboard load time

## Testing Strategy

- Unit tests for each server action (mock Supabase client)
- E2E test: Access control dashboard loads with real data
- E2E test: Badge CRUD operations
- E2E test: Visitor check-in/check-out flow
- E2E test: Access log scanning via `/api/c66`

## Performance Considerations

- Use `Promise.all()` for parallel queries in page.tsx
- Cache `getBadgeStatusDistribution()` for 5 minutes (infrequently changing)
- Cache `getEntityBadgeStatus()` for 1 minute
- Real-time data: `getRecentAccessActivity()` and `getHourlyAccessStats()` should be fresh
- Consider materialized view for entity coverage percentage

## Security Checklist

- [ ] All server actions verify `access_control` or `admin` role
- [ ] RLS policies restrict badges/access_logs to authorized roles
- [ ] No service-role client used for operational queries (RLS must apply)
- [ ] Input validation on all server action parameters
- [ ] Audit logging for badge issuance/revocation
