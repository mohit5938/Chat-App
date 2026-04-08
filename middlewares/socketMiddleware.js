import jwt from "jsonwebtoken";
import cookie from "cookie";

export const socketAuthMiddleware = (socket, next) => {
    try {
       
        const cookies = socket.handshake.headers.cookie;
      

        if (!cookies) return next(new Error("No cookies"));

        const parsed = cookie.parse(cookies);
        const token = parsed.token;

        if (!token) return next(new Error("No token"));

        const decoded =   jwt.verify(token, process.env.JWT_SECRET);

        socket.user = decoded;

        next();
    } catch (err) {
        next(new Error("Auth failed"));
    }
};