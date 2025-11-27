
export default function adminMiddleware(req, res, next) {
    if (!req.user) {
        return res.status(403).json({ message: "Forbidden: Authentication required." });
    }
    if (req.user.role !== 'admin') {
        console.warn(`Access Denied: User ${req.user.email} (Role: ${req.user.role}) attempted to access admin route.`);
        return res.status(403).json({ message: "Access denied. Admins only." });
    }

    console.log(`Admin Access Granted for: ${req.user.email}`);
    next();
}