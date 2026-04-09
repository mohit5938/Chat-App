import jwt from "jsonwebtoken";
import cookie from "cookie";

export const socketAuthMiddleware = (socket, next) => {
    try {
       
        const cookies = socket.handshake.headers?.cookie;
      

        if (!cookies) return next(new Error("No cookies"));

        const parsed = cookie.parse(cookies);
        const token = parsed.token;

        if (!token) return next(new Error("No token"));

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET not defined");
        }

        const decoded =   jwt.verify(token, process.env.JWT_SECRET);

        socket.user = decoded;

        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return next(new Error("Token expired"));
        }
        return next(new Error("Invalid token"));
    }
};