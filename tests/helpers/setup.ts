import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test-specific env
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Ensure required vars exist
const REQUIRED = ['API_URL'];
for (const key of REQUIRED) {
  if (!process.env[key]) {
    throw new Error(`Missing required env variable: ${key}. Copy .env.test.example to .env.test`);
  }
}

// Global test state (populated by seed)
if (!(global as any).__TEST_STATE__) {
  (global as any).__TEST_STATE__ = {
    adminToken: null, // Will be set by first test that logs in
    students: {},
    teachers: {},
    hostels: {},
    rooms: {},
    windows: {},
  };
}
