/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import schema from "./schema";

// Module map for convex-test (tests and this helper are excluded).
export const modules = import.meta.glob([
  "./**/*.ts",
  "./_generated/*.js",
  "!./**/*.test.ts",
  "!./test.setup.ts",
]);

export function newTest() {
  const t = convexTest(schema, modules);
  rateLimiterTest.register(t, "rateLimiter");
  return t;
}

export const PEPPER = "test-pepper-not-a-secret";
