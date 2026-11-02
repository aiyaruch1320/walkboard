import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { findByEmail } from "../db/userRepo";
import { saveRefresh, takeRefresh } from "./tokenStore";

const ACCESS_TTL = "15m";
const REFRESH_TTL_SECONDS = 14 * 24 * 3600;
// Compared when the email is unknown, so both failures take the same time.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO7fWJ4m1h1Qx9bH5s2G1f1Z0Zp8C6aGq";

export type Tokens = { accessToken: string; refreshToken: string };

function issue(user: { id: number; role: string }): Promise<Tokens> {
  const accessToken = jwt.sign({ sub: String(user.id), role: user.role }, process.env.JWT_SECRET!, {
    expiresIn: ACCESS_TTL,
  });
  const refreshToken = crypto.randomBytes(32).toString("base64url");
  return saveRefresh(refreshToken, user, REFRESH_TTL_SECONDS).then(() => ({ accessToken, refreshToken }));
}

/**
 * One answer for every failure: unknown email, wrong password or a locked
 * account all return null, so callers cannot tell which one happened.
 */
export async function login(email: string, password: string): Promise<Tokens | null> {
  const user = await findByEmail(email);
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok || user.locked) return null;
  return issue(user);
}

export async function refresh(token: string): Promise<Tokens | null> {
  const user = await takeRefresh(token);
  return user ? issue(user) : null;
}
