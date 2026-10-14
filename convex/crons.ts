import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.hourly(
  "purge expired challenges",
  { minuteUTC: 17 },
  internal.challenges.purgeExpired,
  {},
);

export default crons;
