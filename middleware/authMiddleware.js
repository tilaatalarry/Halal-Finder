import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1]; // Bearer <token>

  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role }; // ensure consistent structure
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token." });
  }
}


// import pkg from 'jsonwebtoken';
// const { verify } = pkg;

// function authMiddleware(req, res, next) {
//   const token = req.header('Authorization')?.split(' ')[1]; 
//   if (!token) {
//     return res.status(401).json({ message: 'Access denied. No token provided.' });
//   }

//   try {
//     const decoded = verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     res.status(400).json({ message: 'Invalid token.' });
//   }
// }

// export default authMiddleware;
