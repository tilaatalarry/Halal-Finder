import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import spotsRouter from "./routes/spots.js";
import authMiddleware from "./middleware/authMiddleware.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/api/auth", authRoutes);
app.use("/api/spots", spotsRouter);

import db from "./db.js";
app.get("/api/halal", async (req, res) => {
  const query = req.query.query || "";
  try {
    const [rows] = await db.query(
      "SELECT * FROM halal_spots WHERE name LIKE ? OR address LIKE ? OR type LIKE ?",
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get('/dashboard', authMiddleware, (req, res) => {
  res.json({message: `Welcome ${req.user.id}`});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
