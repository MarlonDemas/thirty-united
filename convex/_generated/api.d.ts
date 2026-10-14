/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as challenges from "../challenges.js";
import type * as crons from "../crons.js";
import type * as lib_inviteGate from "../lib/inviteGate.js";
import type * as lib_limits from "../lib/limits.js";
import type * as lib_otp from "../lib/otp.js";
import type * as lib_requestFlow from "../lib/requestFlow.js";
import type * as lib_validation from "../lib/validation.js";
import type * as mail_message from "../mail/message.js";
import type * as mail_provider from "../mail/provider.js";
import type * as mail_send from "../mail/send.js";
import type * as otp from "../otp.js";
import type * as rsvp from "../rsvp.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  challenges: typeof challenges;
  crons: typeof crons;
  "lib/inviteGate": typeof lib_inviteGate;
  "lib/limits": typeof lib_limits;
  "lib/otp": typeof lib_otp;
  "lib/requestFlow": typeof lib_requestFlow;
  "lib/validation": typeof lib_validation;
  "mail/message": typeof mail_message;
  "mail/provider": typeof mail_provider;
  "mail/send": typeof mail_send;
  otp: typeof otp;
  rsvp: typeof rsvp;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
