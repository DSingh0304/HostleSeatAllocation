import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { expect } from 'vitest';

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

/**
 * Creates an Axios client for the ResidentIQ API.
 * Optionally attaches an Authorization Bearer token.
 */
export function createClient(token?: string): AxiosInstance {
  const instance = axios.create({
    baseURL: BASE_URL,
    validateStatus: () => true, // Don't throw on non-2xx so tests can assert on status codes
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return instance;
}

/**
 * Authenticates a student and returns the access token.
 */
export async function loginStudent(rollNumber: string, password: string): Promise<string> {
  // Try provided password first
  let res = await createClient().post('/auth/login', { rollNumber, password });
  if (res.status === 200) return res.data.token || res.data.accessToken;

  // Fallback: try per-user password pattern (rollNumber@iiituna)
  try {
    const { getStudentPassword } = await import('../fixtures/data');
    const fallback = getStudentPassword(rollNumber);
    if (fallback !== password) {
      res = await createClient().post('/auth/login', { rollNumber, password: fallback });
      if (res.status === 200) return res.data.token || res.data.accessToken;
    }
  } catch (e) {
    // ignore import errors and fall through
  }

  throw new Error(`Student login failed for ${rollNumber}: ${JSON.stringify(res.data)}`);
}

/**
 * Authenticates an admin and returns the access token.
 * Uses cached token if available to avoid rate limiting.
 */
export async function loginAdmin(email: string, password: string): Promise<string> {
  // Check if we already have a valid token in global state
  const state = (globalThis as any).__TEST_STATE__;
  if (state?.adminToken) {
    return state.adminToken;
  }

  const res = await createClient().post('/auth/admin/login', { email, password });
  if (res.status !== 200) {
    throw new Error(`Admin login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  
  const token = res.data.token || res.data.accessToken;
  
  // Cache the token for other tests
  if (state) {
    state.adminToken = token;
  }
  
  return token;
}

/**
 * Authenticates a teacher and returns the access token.
 */
export async function loginTeacher(employeeId: string, password: string): Promise<string> {
  // Try provided password first
  let res = await createClient().post('/auth/teacher/login', { employeeId, password });
  if (res.status === 200) return res.data.token || res.data.accessToken;

  // Fallback: try per-teacher password pattern (employeeId@iiituna)
  try {
    const { getTeacherPassword } = await import('../fixtures/data');
    const fallback = getTeacherPassword(employeeId);
    if (fallback !== password) {
      res = await createClient().post('/auth/teacher/login', { employeeId, password: fallback });
      if (res.status === 200) return res.data.token || res.data.accessToken;
    }
  } catch (e) {
    // ignore import errors
  }

  throw new Error(`Teacher login failed for ${employeeId}: ${JSON.stringify(res.data)}`);
}

/**
 * Helper to extract response data safely.
 */
export function expectStatus(res: AxiosResponse, status: number): void {
  if (res.status !== status) {
    console.error(`\x1b[31m[FAILED TEST LOG]\x1b[0m Expected ${status}, got ${res.status}.`);
    console.error(`\x1b[33mURL:\x1b[0m ${res.config.method?.toUpperCase()} ${res.config.url}`);
    console.error(`\x1b[33mResponse Body:\x1b[0m`, JSON.stringify(res.data, null, 2));
  }
  expect(res.status).toBe(status);
}

/**
 * Sleep utility for time-dependent tests.
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
