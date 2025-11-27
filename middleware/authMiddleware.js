import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
        console.warn("Auth Failed: No token provided in header.");
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        req.user = { 
            id: decoded.id, 
            role: decoded.role, 
            email: decoded.email 
        }; 
        
        console.log("Auth SUCCESS. Attached User Email:", req.user.email);
        
        next();
    } catch (error) { 
        
        console.error("Auth FAILURE. Token verification failed:", error.message); 
        return res.status(401).json({ message: "Invalid token." });
    }
}