import { redis } from "../db/redis";

type Owner = { id: number; role: string };

export async function saveRefresh(token: string, user: Owner, ttlSeconds: number) {
  await redis.set(`refresh:${token}`, JSON.stringify(user), "EX", ttlSeconds);
}

// Single use: the token is deleted as it is read, so a stolen copy works at most once.
export async function takeRefresh(token: string): Promise<Owner | null> {
  const raw = await redis.getdel(`refresh:${token}`);
  return raw ? JSON.parse(raw) : null;
}
