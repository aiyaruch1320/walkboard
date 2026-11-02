import { Router } from "express";
import { z } from "zod";
import * as auth from "../services/authService";

const credentials = z.object({
  email: z.string().email().transform((e) => e.toLowerCase()),
  password: z.string().min(8).max(200),
});

const refreshBody = z.object({ refreshToken: z.string().min(20) });

export const authRoutes = Router();

authRoutes.post("/auth/login", async (req, res) => {
  const body = credentials.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "invalid_request" });
  const tokens = await auth.login(body.data.email, body.data.password);
  if (!tokens) return res.status(401).json({ error: "invalid_credentials" });
  res.json(tokens);
});

authRoutes.post("/auth/refresh", async (req, res) => {
  const body = refreshBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "invalid_request" });
  const tokens = await auth.refresh(body.data.refreshToken);
  if (!tokens) return res.status(401).json({ error: "invalid_refresh_token" });
  res.json(tokens);
});
