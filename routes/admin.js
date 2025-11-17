import express from "express";
import db from "../db.js";
import nodemailer from "nodemailer";
import authAdmin from "../middleware/authAdmin.js";
const router = express.Router();

router.use(authAdmin);
router.use(async (req, res, next) => {
  const user = req.session?.user;
  if (!user || !user.is_admin) {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
});

router.get("/spots", async (req, res) => {
  try {
    const [spots] = await db.query("SELECT * FROM halal_spots");
    res.json(spots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching spots" });
  }
});

router.put("/spots/:id/status", async (req, res) => {
  const { id } = req.params;
  const {status} = req.body;

  try {
    await db.query("UPDATE halal_spots SET status = ? WHERE id = ?", [status, id]);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let subject, text;
    if (status === "approved") {
      subject = "Your Halal Spot has been Approved!";
      text = "Good news! Your halal spot has been approved and is now visible to users.";
    } else if (status === "rejected") {
      subject = "Your Halal Spot has been Rejected";
      text = "Sorry, your halal spot submission was rejected by the admin.";
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject,
      text,
    });

    res.json({ message: `Spot ${status} successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating status" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const [users] = await db.query("SELECT id, name, email, is_admin FROM users");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching users" });
  }
});

router.delete("/spots/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM halal_spots WHERE id = ?", [id]);
    res.json({ message: "Spot deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting spot" });
  }
});

export default router;
