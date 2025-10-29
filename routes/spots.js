import express from "express";
import db from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";
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

router.post("/", authMiddleware, async (req, res) => {
  const { name, type, address, rating, lat, lng, image, description } = req.body;

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
