import express from "express";
import cors    from "cors";
import { scoresRouter } from "./routes/scores.js";

const app  = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

// Health check for Render
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// API routes
app.use("/api/scores", scoresRouter);

app.listen(PORT, () => {
  console.log(`[server] running on port ${PORT}`);
});
