import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export default function authAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(403).json({ message: "Access denied. No token provided." });

  const token = authHeader.split(" ")[1]; 

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") return res.status(403).json({ message: "Admins only." });
    req.user = decoded; 
    next();
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: "Invalid token." });
  }
}
