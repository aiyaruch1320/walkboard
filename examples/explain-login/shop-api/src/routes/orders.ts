import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { pool } from "../db/pool";

export const orderRoutes = Router();

orderRoutes.use(requireAuth);

type OrderRow = { id: number; total: string; created_at: string };

async function ordersOf(userId: number): Promise<OrderRow[]> {
  const { rows } = await pool.query<OrderRow>(
    "SELECT id, total, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
    [userId],
  );
  return rows;
}

// The user id always comes from the verified token, never from the request,
// so nobody can list someone else's orders by changing a parameter.
orderRoutes.get("/orders", async (req, res) => {
  res.json(await ordersOf(req.user!.id));
});
