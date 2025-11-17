import express from "express";
import db from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";
import multer from  'multer';
import  path from 'path';
import { fileURLToPath } from "url";
import { body } from "express-validator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
const router = express.Router();

router.get("/", async (req, res) => {
  const { query, type } = req.query;
  let sql = "SELECT * FROM halal_spots WHERE 1=1";
  const params = [];

  if (query) {
    sql += " AND name LIKE ?";
    params.push(`%${query}%`);
  }

  if (type && type !== "all") {
    sql += " AND type = ?";
    params.push(type);
  }

  try {
    const [results] = await db.query(sql, params);
    res.json(results);
  } catch (err) {
    console.error("Error fetching halal spots:", err.message);
    res.status(500).json({ error: "Server error fetching halal spots." });
  }
});

router.post("/add", authMiddleware, upload.single("image"), async (req, res) => {
  console.log("Incoming add spot request!");
  console.log("File:", req.file);
  console.log("Body:", req.body);
  const { name, type, address, rating, lat, lng, description } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  if (!name || !type || !address) {
    return res.status(400).json({ error: "Name, type, and address are required." });
  }

  const sql = `
    INSERT INTO halal_spots (name, type, address, rating, lat, lng, image, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await db.query(sql, [
      name, type, address, rating || null, lat || null, lng || null, image || null, description || null,
    ]);
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    console.error("Error adding halal spot:", err.message);
    res.status(500).json({ error: "Server error adding halal spot." });
  }
});

export default router;
