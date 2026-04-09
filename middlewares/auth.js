import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    try {
    
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded; // { _id, email, name, ... }
        next();
    } catch (error) {
        res.clearCookie("token");

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired",
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid token",
        });
    }
};
