# ResidentIQ Test Environment

> Production-grade test suite for the ResidentIQ Hostel Seat Allocation System.  
> Covers **1000 students + 30 teachers** across all features with full edge-case coverage.

## Directory Structure

```
tests/
├── .env.test.example       ← Copy to .env.test and fill values
├── package.json
├── vitest.config.ts
├── fixtures/
│   └── data.ts             ← Generators for students, teachers, hostels, rooms
├── helpers/
│   ├── setup.ts            ← Global env loader
│   ├── api-client.ts       ← Axios wrappers + login helpers
│   └── seed-test-data.ts   ← Full 1000-student seed script
├── e2e/
│   ├── 01-setup.test.ts    ← Admin setup + hostel/room/window creation
│   ├── 02-auth.test.ts     ← Login, refresh, logout, password flow
│   ├── 03-student-booking.test.ts  ← Solo booking, capacity, conflicts
│   ├── 04-invites.test.ts  ← Roommate invite full flow + edge cases
│   ├── 05-admin-ops.test.ts ← Manual override, reports, notices
│   ├── 06-bulk.test.ts     ← Bulk 1000-student booking stress test
│   └── 07-edge-cases.test.ts ← All edge cases (locks, expired windows, etc.)
├── unit/
│   └── allocation-logic.test.ts   ← Pure logic unit tests
└── reports/
    └── .gitkeep
```

## Quick Start

```bash
# 1. Install dependencies
cd tests && npm install

# 2. Configure environment
cp .env.test.example .env.test
# Edit .env.test with your API URL and admin credentials

# 3. Start the server (in another terminal)
cd .. && ./start.sh

# 4. Run all tests
npm test

# 5. Run only E2E tests
npm run test:e2e

# 6. Generate coverage report
npm run test:coverage
```

## Test Scenarios

| Suite | Tests | Description |
|-------|-------|-------------|
| `01-setup` | 12 | Admin init, hostels, rooms, windows |
| `02-auth` | 18 | All auth flows + security |
| `03-student-booking` | 24 | Booking, cancellation, concurrency |
| `04-invites` | 20+ | Invite lifecycle + all edge cases |
| `05-admin-ops` | 25+ | Admin panel operations, reports, notices |
| `06-bulk` | 15+ | 1000-student load test, concurrent operations |
| `07-edge-cases` | 40+ | All boundary/edge scenarios, security |
| `unit/allocation-logic` | 50+ | Pure logic unit tests |

## Edge Cases Covered

- **Booking Conflicts:**
  - Booking to full room (capacity enforcement)
  - Double-booking prevention
  - Concurrent booking race condition (Redis lock)
  - Booking after cancellation

- **Gender & Access Control:**
  - Gender mismatch across all flows (male→female, female→male, no gender)
  - Cross-hostel booking attempt
  - Room-level gender override

- **Time & Window Management:**
  - Expired allocation windows
  - Locked allocation windows
  - Window time boundaries (before open, after close)
  - Cancellation after window lock
  - 5-min private window auto-expiry
  - 10-min group lock enforcement

- **Room Status:**
  - Room in maintenance status
  - Room status transitions (available ↔ maintenance)
  - Reserved rooms

- **Restrictions:**
  - Program/Year restriction filtering
  - Priority-tier enforcement
  - Hostel-specific restrictions

- **Invites:**
  - Self-invite prevention
  - Invite to already-allocated student
  - Expired invites (30-min timeout)
  - Gender mismatch in invites
  - Invite to full room
  - Multiple pending invites capacity check

- **Security:**
  - JWT token expiry and refresh
  - Invalid/malformed tokens
  - SQL injection attempts
  - XSS in user inputs
  - Rate limiting on booking endpoint

- **Admin Operations:**
  - Admin override on locked windows
  - Force allocation to full room
  - Manual unallocation
  - Bulk import CSV validation

- **Data Integrity:**
  - Orphaned data cleanup
  - Database consistency after bulk operations
  - Room occupancy accuracy
  - No capacity violations (without override)

- **Input Validation:**
  - Invalid UUIDs and malformed requests
  - Very long input strings (500+ chars)
  - Unicode and emoji in names/addresses
  - Null/undefined handling
  - Empty arrays and objects
  - Boundary values (year=0, capacity=0, etc.)

- **Performance:**
  - 1000-student concurrent booking
  - 50+ simultaneous requests
  - Race condition handling
  - Memory and connection pool stability
