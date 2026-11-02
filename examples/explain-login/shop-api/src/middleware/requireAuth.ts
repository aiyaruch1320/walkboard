import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

declare module "express-serve-static-core" {
  interface Request { user?: { id: number; role: string } }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string; role: string };
    req.user = { id: Number(claims.sub), role: claims.role };
    next();
  } catch {
    res.status(401).json({ error: "unauthorized" });
  }
}
