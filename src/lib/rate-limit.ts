const globalForRateLimit = globalThis as unknown as {
  rateLimitStore?: Map<string, { count: number; resetsAt: number }>;
};

const rateLimitStore =
  globalForRateLimit.rateLimitStore ?? new Map<string, { count: number; resetsAt: number }>();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.rateLimitStore = rateLimitStore;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}

/**
 * Checks if a request should be limited based on a key (e.g., IP or Email).
 * Uses a simple fixed-window rate limiting algorithm.
 * 
 * @param key Unique key to identify the requester (e.g. "ip:127.0.0.1" or "email:test@domain.com")
 * @param limit Max allowed requests within the window
 * @param windowMs Time window in milliseconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetsAt) {
    const resetsAt = now + windowMs;
    const newRecord = { count: 1, resetsAt };
    rateLimitStore.set(key, newRecord);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: new Date(resetsAt),
    };
  }

  record.count += 1;

  if (record.count > limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: new Date(record.resetsAt),
    };
  }

  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: new Date(record.resetsAt),
  };
}

import { NextRequest } from "next/server";

/**
 * Convenience helper to perform dual-key rate limiting (IP + Email)
 */
export async function checkRateLimits(
  req: NextRequest,
  {
    email,
    ipLimit = 15,
    emailLimit = 5,
    windowMs = 15 * 60 * 1000 // 15 mins
  }: {
    email?: string;
    ipLimit?: number;
    emailLimit?: number;
    windowMs?: number;
  }
) {
  if (process.env.NODE_ENV !== "production" || process.env.DISABLE_RATE_LIMITS === "true") {
    return { success: true };
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";

  // Check IP rate limit
  const ipResult = await rateLimit(`ip:${ip}`, ipLimit, windowMs);
  if (!ipResult.success) {
    return { 
      success: false, 
      error: "Muitas requisições deste endereço IP. Tente novamente mais tarde." 
    };
  }

  // Check Email rate limit if email is provided
  if (email) {
    const emailResult = await rateLimit(`email:${email.toLowerCase().trim()}`, emailLimit, windowMs);
    if (!emailResult.success) {
      return { 
        success: false, 
        error: "Muitas requisições para este e-mail. Tente novamente mais tarde." 
      };
    }
  }

  return { success: true };
}
