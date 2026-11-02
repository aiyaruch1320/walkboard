import { pool } from "./pool";

export type UserRow = { id: number; role: string; password_hash: string; locked: boolean };

export async function findByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await pool.query<UserRow>(
    "SELECT id, role, password_hash, locked FROM users WHERE email = $1",
    [email],
  );
  return rows[0] ?? null;
}
