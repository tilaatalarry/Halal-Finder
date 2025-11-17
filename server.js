import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import session from "express-session";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import spotsRouter from "./routes/spots.js";
import adminRoutes from "./routes/admin.js";
import authMiddleware from "./middleware/authMiddleware.js";
import db from "./db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/spots", spotsRouter);
app.use("/api/admin", adminRoutes);

app.get("/dashboard", authMiddleware, (req, res) => {
  res.json({ message: `Welcome ${req.user.id}` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
