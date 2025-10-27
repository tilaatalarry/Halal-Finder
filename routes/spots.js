import express from "express";
import db from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

router.get("/", async (req, res) => {
  const { type } = req.query;
  let sql = "SELECT * FROM halal_spots";
  const params = type ? [type] : [];
  if (type) sql += " WHERE type = ?";

  try {
    const [results] = await db.query(sql, params);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { name, type, address, rating, lat, lng, image } = req.body;
  if (!name || !type || !address) return res.status(400).json({ error: "Name, type, and address are required." });

  const sql = `
    INSERT INTO halal_spots (name, type, address, rating, lat, lng, image)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  try {
    const [result] = await db.query(sql, [name, type, address, rating || null, lat || null, lng || null, image || null]);
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;