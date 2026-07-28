import { env } from "../config/env.js";
import { appRedis } from "../redis/connections.js";

const LUA_CHECK_AND_INCREMENT = `
local current = tonumber(redis.call("GET", KEYS[1]) or "0")
local max = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])

if current >= max then
  local remaining = redis.call("PTTL", KEYS[1])
  if remaining < 1 then
    remaining = ttl
  end
  return {0, remaining, current}
end

current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ttl)
end

return {1, ttl, current}
`;

export type HourlyGateResult =
  | { allowed: true; count: number }
  | { allowed: false; retryAfterMs: number; count: number };

export async function consumeGlobalHourlySlot(): Promise<HourlyGateResult> {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setUTCMinutes(0, 0, 0);
  nextHour.setUTCHours(nextHour.getUTCHours() + 1);

  const ttlMs = Math.max(1000, nextHour.getTime() - now.getTime());
  const hourKey = [
    "reachinbox",
    "email-hourly",
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
    String(now.getUTCHours()).padStart(2, "0"),
  ].join(":");

  const result = (await appRedis.eval(
    LUA_CHECK_AND_INCREMENT,
    1,
    hourKey,
    String(env.MAX_EMAILS_PER_HOUR),
    String(ttlMs),
  )) as [number, number, number];

  if (result[0] === 1) {
    return { allowed: true, count: result[2] };
  }

  return {
    allowed: false,
    retryAfterMs: Math.max(1000, result[1]),
    count: result[2],
  };
}
