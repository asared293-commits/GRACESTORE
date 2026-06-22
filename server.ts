import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import axios from "axios";

const app = express();
const PORT = 3000;

// Ensure upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multiplexing multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

app.use(express.json());

// API routes
app.get("/api/geocode/search", async (req, res) => {
  const { q, limit, countrycodes } = req.query;
  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: { format: "json", q, limit, countrycodes },
      headers: {
        "User-Agent": "AshaimanDeliveryApp/1.0"
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error("Geocode search error:", error);
    res.status(500).json({ error: "Failed to fetch geocode data" });
  }
});

app.get("/api/geocode/reverse", async (req, res) => {
  const { lat, lon } = req.query;
  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: { format: "json", lat, lon },
      headers: {
        "User-Agent": "AshaimanDeliveryApp/1.0"
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error("Reverse geocode error:", error);
    res.status(500).json({ error: "Failed to fetch reverse geocode data" });
  }
});

app.post("/api/upload", upload.array("images"), (req, res) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }
  const urls = files.map((file) => `/uploads/${file.filename}`);
  res.json({ urls });
});

// Vite middleware for development
async function setupVite() {
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
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
