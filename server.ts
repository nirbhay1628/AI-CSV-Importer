import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { processCSVBatch } from "./src/server/gemini.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse JSON bodies up to 10MB to accommodate larger CSV imports
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Main import endpoint: processes a batch of raw records
  app.post("/api/import", async (req, res) => {
    try {
      const { rows } = req.body;
      if (!rows || !Array.isArray(rows)) {
        res.status(400).json({ error: "Missing or invalid 'rows' field in request body." });
        return;
      }

      if (rows.length === 0) {
        res.json({ results: [] });
        return;
      }

      // Check if GEMINI_API_KEY is available
      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          error: "Gemini API Key is not configured on the server. Please add it in the Secrets panel."
        });
        return;
      }

      console.log(`Processing batch of ${rows.length} rows...`);
      const results = await processCSVBatch(rows);
      res.json({ results });
    } catch (error) {
      console.error("Error inside /api/import:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "An unexpected error occurred during processing."
      });
    }
  });

  // Vite middleware for development, static file serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
