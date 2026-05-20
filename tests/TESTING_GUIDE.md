# ResidentIQ Testing Guide

Complete guide for running and maintaining the production-grade test suite.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Test Data Management](#test-data-management)
5. [Writing New Tests](#writing-new-tests)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- Node.js 20+
- Running ResidentIQ server (API + Database + Redis)
- Admin account created

### Setup

```bash
# 1. Navigate to tests directory
cd tests

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.test.example .env.test
# Edit .env.test with your API URL and admin credentials

# 4. Ensure server is running
cd ../
./start.sh

# 5. Seed test data (1000 students + 30 teachers)
cd tests
npm run seed:test

# 6. Run all tests
npm test
```

## Test Structure

```
tests/
├── e2e/                          # End-to-end integration tests
│   ├── 01-setup.test.ts          # Admin setup, hostels, rooms, windows
│   ├── 02-auth.test.ts           # Authentication & authorization
│   ├── 03-student-booking.test.ts # Booking flows
│   ├── 04-invites.test.ts        # Roommate invites
│   ├── 05-admin-ops.test.ts      # Admin operations
│   ├── 06-bulk.test.ts           # Load testing (1000 students)
│   └── 07-edge-cases.test.ts     # Edge cases & security
├── unit/                         # Unit tests
│   └── allocation-logic.test.ts  # Pure logic tests
├── fixtures/                     # Test data generators
│   └── data.ts                   # Student, teacher, hostel fixtures
├── helpers/                      # Test utilities
│   ├── setup.ts                  # Global test setup
│   ├── api-client.ts             # API client & auth helpers
│   ├── seed-test-data.ts         # Bulk data seeding
│   ├── reset-test-db.ts          # Database cleanup
│   └── report-generator.js       # HTML report generator
└── reports/                      # Test output
    ├── coverage/                 # Coverage reports
    └── test-report.html          # Human-readable report
```

## Running Tests

### All Tests

```bash
npm test
```

### Specific Test Suites

```bash
# E2E tests only
npm run test:e2e

# Unit tests only
npm run test:unit

# Specific file
npx vitest run e2e/04-invites.test.ts
```

### Watch Mode (Development)

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
# Open reports/coverage/index.html in browser
```

### HTML Report

```bash
npm run test:report
# Open reports/test-report.html in browser
```

### CI Mode

```bash
npm run test:ci
# Generates both verbose output and JSON report
```

## Test Data Management

### Seeding Test Data

The seed script creates:
- 350 male B.Tech students
- 200 female B.Tech students
- 150 male M.Tech students
- 100 female M.Tech students
- 100 male PhD students
- 100 female PhD students
- 15 male teachers
- 15 female teachers

```bash
npm run seed:test
```

**Note:** Seeding is idempotent. Re-running skips existing students.

### Resetting Database

⚠️ **WARNING:** This deletes ALL test data!

```bash
npm run reset:test
```

You'll be prompted to confirm before deletion.

### Manual Data Creation

Tests automatically create their own data as needed. The seed script is optional but recommended for:
- Load testing (06-bulk.test.ts)
- Performance benchmarking
- Manual testing via UI

## Writing New Tests

### Test File Template

```typescript
/**
 * E2E Test Suite XX: Feature Name
 *
 * Tests:
 *  - Test case 1
 *  - Test case 2
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, expectStatus } from '../helpers/api-client';
import { generateStudent, DEFAULT_STUDENT_PASSWORD } from '../fixtures/data';

const state = (globalThis as any).__TEST_STATE__;

let adminClient: ReturnType<typeof createClient>;

beforeAll(async () => {
  adminClient = createClient(state.adminToken);
});

describe('Feature Name', () => {
  it('test case description', async () => {
    const res = await adminClient.get('/endpoint');
    expectStatus(res, 200);
    expect(res.data).toHaveProperty('field');
  });
});
```

### Best Practices

1. **Use Descriptive Names**
   ```typescript
   // Good
   it('prevents male student from booking female hostel room', ...)
   
   // Bad
   it('test booking', ...)
   ```

2. **Test One Thing Per Test**
   ```typescript
   // Good
   it('creates student', ...)
   it('validates student email', ...)
   
   // Bad
   it('creates and validates student', ...)
   ```

3. **Use Fixtures for Test Data**
   ```typescript
   const student = generateStudent({ gender: 'male', program: 'btech', year: 2 });
   ```

4. **Clean Up After Tests**
   ```typescript
   afterAll(async () => {
     // Delete test-specific data if needed
   });
   ```

5. **Handle Async Properly**
   ```typescript
   it('async test', async () => {
     const res = await client.get('/endpoint');
     expectStatus(res, 200);
   });
   ```

6. **Use Global State for Shared Data**
   ```typescript
   state.testRoomId = res.data.id; // Store for later tests
   ```

### Adding Edge Cases

Add new edge cases to `07-edge-cases.test.ts`:

```typescript
describe('New Edge Case Category', () => {
  it('handles specific edge case', async () => {
    // Test implementation
  });
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          npm install
          cd server && npm install
          cd ../tests && npm install
      
      - name: Setup database
        run: |
          cd server
          npm run prisma:generate
          npm run prisma:migrate
      
      - name: Start server
        run: |
          cd server
          npm run build
          npm start &
          sleep 10
      
      - name: Run tests
        run: |
          cd tests
          npm run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./tests/reports/coverage/coverage-final.json
      
      - name: Upload test report
        uses: actions/upload-artifact@v3
        with:
          name: test-report
          path: tests/reports/test-report.html
```

## Troubleshooting

### Tests Failing to Connect

**Problem:** `ECONNREFUSED` or connection timeout

**Solution:**
1. Ensure server is running: `curl http://localhost:3000/health`
2. Check API_URL in `.env.test` matches server port
3. Verify Docker containers are up: `docker ps`

### Authentication Failures

**Problem:** `401 Unauthorized` in tests

**Solution:**
1. Verify admin credentials in `.env.test`
2. Check if admin account exists: `curl -X POST http://localhost:3000/api/auth/admin/login -H "Content-Type: application/json" -d '{"email":"superadmin@residentiq.test","password":"Admin@123456"}'`
3. Create admin if needed via API or seed script

### Database State Issues

**Problem:** Tests fail due to existing data

**Solution:**
```bash
npm run reset:test  # Clean database
npm run seed:test   # Re-seed if needed
npm test            # Run tests
```

### Timeout Errors

**Problem:** Tests timeout after 30 seconds

**Solution:**
1. Increase timeout in specific test:
   ```typescript
   it('slow test', async () => {
     // test code
   }, 60000); // 60 second timeout
   ```

2. Or globally in `vitest.config.ts`:
   ```typescript
   testTimeout: 60000
   ```

### Race Conditions

**Problem:** Intermittent failures in concurrent tests

**Solution:**
- Tests run sequentially by default (`singleFork: true`)
- If adding parallel tests, ensure proper isolation
- Use unique test data for each test

### Memory Issues

**Problem:** Tests crash with out-of-memory errors

**Solution:**
1. Run tests in smaller batches:
   ```bash
   npx vitest run e2e/01-setup.test.ts
   npx vitest run e2e/02-auth.test.ts
   # etc.
   ```

2. Increase Node.js memory:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm test
   ```

### Coverage Not Generated

**Problem:** Coverage report is empty

**Solution:**
```bash
npm install --save-dev @vitest/coverage-v8
npm run test:coverage
```

## Performance Benchmarks

Expected test execution times (on modern hardware):

| Suite | Duration | Notes |
|-------|----------|-------|
| 01-setup | ~10s | Creates hostels, rooms, windows |
| 02-auth | ~5s | Login/logout flows |
| 03-student-booking | ~8s | Booking operations |
| 04-invites | ~12s | Invite flows |
| 05-admin-ops | ~15s | Admin operations |
| 06-bulk | ~60s | 1000-student load test |
| 07-edge-cases | ~30s | Comprehensive edge cases |
| unit tests | ~1s | Pure logic tests |
| **Total** | **~2-3 min** | Full suite |

## Maintenance

### Regular Tasks

1. **Update test data generators** when schema changes
2. **Add tests for new features** before merging
3. **Review and update edge cases** quarterly
4. **Monitor test execution time** and optimize slow tests
5. **Keep dependencies updated** (`npm audit`, `npm update`)

### When to Update Tests

- ✅ New API endpoint added → Add E2E test
- ✅ Schema change → Update fixtures
- ✅ Bug fixed → Add regression test
- ✅ Security vulnerability → Add security test
- ✅ Performance optimization → Update benchmarks

## Support

For issues or questions:
1. Check this guide
2. Review test output and error messages
3. Check server logs: `docker logs residentiq-api`
4. Open an issue with:
   - Test output
   - Environment details
   - Steps to reproduce
