import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

const SHOWCASE_KEY = "theme_showcase_urls";
const HERO_KEY = "hero_showcase_url";

router.get("/public/hero-showcase", async (_req, res) => {
  try {
    const content = await prisma.siteContent.findUnique({ where: { key: HERO_KEY } });
    if (!content) return res.json({ url: "" });
    return res.json(JSON.parse(content.content));
  } catch { return res.json({ url: "" }); }
});

router.get("/admin/hero-showcase", async (_req, res) => {
  try {
    const content = await prisma.siteContent.findUnique({ where: { key: HERO_KEY } });
    if (!content) return res.json({ url: "" });
    return res.json(JSON.parse(content.content));
  } catch { return res.json({ url: "" }); }
});

router.put("/admin/hero-showcase", async (req, res) => {
  try {
    const { url } = req.body;
    if (typeof url !== "string") return res.status(400).json({ error: "url must be a string" });
    const data = { url: url.trim() };
    await prisma.siteContent.upsert({
      where: { key: HERO_KEY },
      update: { content: JSON.stringify(data) },
      create: { key: HERO_KEY, title: "히어로 쇼케이스 URL", content: JSON.stringify(data) },
    });
    return res.json({ success: true, ...data });
  } catch (e) {
    console.error("Hero showcase save error:", e);
    return res.status(500).json({ error: "Failed to save" });
  }
});

router.get("/public/theme-showcases", async (_req, res) => {
  try {
    const content = await prisma.siteContent.findUnique({ where: { key: SHOWCASE_KEY } });
    if (!content) return res.json([]);
    return res.json(JSON.parse(content.content));
  } catch { return res.json([]); }
});

router.get("/admin/theme-showcases", async (_req, res) => {
  try {
    const content = await prisma.siteContent.findUnique({ where: { key: SHOWCASE_KEY } });
    if (!content) return res.json([]);
    return res.json(JSON.parse(content.content));
  } catch { return res.json([]); }
});

router.put("/admin/theme-showcases", async (req, res) => {
  try {
    const { showcases } = req.body;
    if (!Array.isArray(showcases)) return res.status(400).json({ error: "showcases must be an array" });
    const validated = showcases.map((s: { name: string; url: string; description?: string }) => ({
      name: s.name || "",
      url: s.url || "",
      description: s.description || "",
    }));
    await prisma.siteContent.upsert({
      where: { key: SHOWCASE_KEY },
      update: { content: JSON.stringify(validated) },
      create: { key: SHOWCASE_KEY, title: "테마 쇼케이스 URL", content: JSON.stringify(validated) },
    });
    return res.json({ success: true, showcases: validated });
  } catch (e) {
    console.error("Showcase save error:", e);
    return res.status(500).json({ error: "Failed to save showcases" });
  }
});

export default router;
