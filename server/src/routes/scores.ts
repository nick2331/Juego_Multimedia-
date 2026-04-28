import { Router, Request, Response } from "express";

const router = Router();

interface ScoreEntry {
  level: string;
  mode:  string;
  time:  number;
  date:  string;
}

// In-memory store (resets on server restart).
// Replace with a DB (Postgres, Mongo) for persistence.
const scores: ScoreEntry[] = [];

router.get("/", (_req: Request, res: Response) => {
  const sorted = [...scores].sort((a, b) => b.time - a.time).slice(0, 20);
  res.json(sorted);
});

router.post("/", (req: Request, res: Response) => {
  const { level, mode, time } = req.body as Partial<ScoreEntry>;
  if (!level || !mode || typeof time !== "number") {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }
  scores.push({ level, mode, time, date: new Date().toISOString() });
  res.status(201).json({ ok: true });
});

export { router as scoresRouter };
