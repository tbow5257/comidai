import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import multer from "multer";
import { db } from "@db";
import { foodLogs } from "@db/schema";
import { analyzeFoodImage } from "./lib/openai";
import { getNutritionInfo } from "./lib/nutritionix";
import { eq } from "drizzle-orm";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Get food logs for authenticated user
  app.get("/api/food-logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const logs = await db.select()
      .from(foodLogs)
      .where(eq(foodLogs.userId, req.user.id))
      .orderBy(foodLogs.createdAt);
    
    res.json(logs);
  });

  // Analyze food image and get nutrition data
  app.post("/api/analyze-food", upload.single("image"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.file) return res.status(400).send("No image uploaded");

    try {
      const base64Image = req.file.buffer.toString("base64");
      const analysis = await analyzeFoodImage(base64Image);
      
      const foodData = [];
      for (const food of analysis.foods) {
        const query = `${food.portion} ${food.name}`;
        const nutrition = await getNutritionInfo(query);
        foodData.push({ ...food, ...nutrition });
      }

      res.json(foodData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Log food entry
  app.post("/api/food-logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const [log] = await db.insert(foodLogs)
        .values({ ...req.body, userId: req.user.id })
        .returning();
      
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
