import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { builds, reviews, users, roles, userRoles } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { addWatermark } from "./services/imageService";
import { setupAuth } from "./auth";

export function registerRoutes(app: Express): Server {
  // Setup authentication first
  setupAuth(app);

  // Get all builds
  app.get("/api/builds", async (_req, res) => {
    const allBuilds = await db.select().from(builds).orderBy(builds.createdAt);
    res.json(allBuilds);
  });

  // Get single build
  app.get("/api/builds/:id", async (req, res) => {
    const build = await db.select()
      .from(builds)
      .where(eq(builds.id, parseInt(req.params.id)))
      .limit(1);

    if (build.length === 0) {
      res.status(404).json({ message: "Build not found" });
      return;
    }

    res.json(build[0]);
  });

  // Create new build with watermark (protected route)
  app.post("/api/builds", async (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ message: "You must be logged in to create builds" });
      return;
    }

    try {
      const { name, description, price, image } = req.body;

      if (!image || !image.startsWith('data:image')) {
        res.status(400).json({ message: "Invalid image format" });
        return;
      }

      // Extract base64 data after the comma
      const base64Data = image.split(',')[1];
      if (!base64Data) {
        res.status(400).json({ message: "Invalid image data" });
        return;
      }

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Add watermark
      const watermarkedImage = await addWatermark(imageBuffer);

      // Convert back to base64
      const processedImage = `data:image/jpeg;base64,${watermarkedImage.toString('base64')}`;

      const newBuild = await db.insert(builds)
        .values({ 
          name, 
          description, 
          price: parseInt(price),
          image: processedImage 
        })
        .returning();

      res.status(201).json(newBuild[0]);
    } catch (error) {
      console.error('Failed to create build:', error);
      res.status(500).json({ 
        message: "Failed to create build", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete build (protected route)
  app.delete("/api/builds/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ message: "You must be logged in to delete builds" });
      return;
    }

    try {
      const deleted = await db.delete(builds)
        .where(eq(builds.id, parseInt(req.params.id)))
        .returning();

      if (deleted.length === 0) {
        res.status(404).json({ message: "Build not found" });
        return;
      }

      res.json({ message: "Build deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete build" });
    }
  });

  // Delete user account
  app.delete("/api/user/delete", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      // Start with user roles
      await db.delete(userRoles)
        .where(eq(userRoles.userId, req.user.id));

      // Delete the user
      await db.delete(users)
        .where(eq(users.id, req.user.id));

      // Log the user out
      req.logout((err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to logout after account deletion" });
        }
        res.json({ message: "Account deleted successfully" });
      });
    } catch (error) {
      console.error('Failed to delete account:', error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}