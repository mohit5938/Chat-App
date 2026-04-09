import express from 'express'
import 'dotenv/config'
import cookieParser from "cookie-parser";
import {db} from './config/connectDB.js'
import  userRouter from './routes/userRoute.js'
import chatRoute from './routes/chatRoute.js';
import adminRoute from './routes/adminRoute.js'
import {Server} from 'socket.io' 
import {createServer} from "http"
import {
    NEW_MESSAGE, NEW_MESSAGE_ALERT, START_TYPING, STOP_TYPING, 
    USER_ONLINE,
    CHAT_JOINED,
    CHAT_LEAVED
} from './constants/event.js'
import {getSockets} from './lib/helper.js'
import {Message} from './models/messageSchema.js'
import cors from 'cors'
import { socketAuthMiddleware } from './middlewares/socketMiddleware.js'
db();

const app = express();
app.set("trust proxy", 1);
const server = createServer(app);
export const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"],
        credentials: true
    }
});

console.log("error find", process.env.CLIENT_URL)

io.use(socketAuthMiddleware);

app.set("io",io)
app.use(express.json());
app.use(cookieParser());
const port = process.env.PORT || 4000 ;

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,

}))

app.use('/api/user', userRouter);
app.use('/api/chat',chatRoute);
app.use('/api/admin',adminRoute);

export const userSocketIDs = new Map();
const onlineUsers = new Set();



io.on("connection", (socket)=>{
   
    const user = socket.user;

    socket.on(CHAT_JOINED, ({userId , members}) => {
onlineUsers.add(userId.toString());

const membersIDs = getSockets(members);
        io.to(membersIDs).emit(USER_ONLINE, Array.from(onlineUsers));

    })

    socket.on(CHAT_LEAVED , ({ userId, members }) => {
        onlineUsers.delete(userId.toString());
        
        const membersIDs = getSockets(members);
        io.to(membersIDs).emit(USER_ONLINE, Array.from(onlineUsers));

    })
    

    userSocketIDs.set(user._id.toString() , socket.id)

    // -------------------------------
    //        NEW MESSAGE
    // -------------------------------

    socket.on(NEW_MESSAGE, async({chatId , members , message})=> {
        if (!chatId || !members || !message) return;
     try {

         const messageForDB = {
             content: message,
             sender: user._id,
             chat: chatId,
         };

         const savedMessage = await Message.create(messageForDB);

         const messageForRealTime = {
             content: savedMessage.content,
             _id: savedMessage._id,
             sender: {
                 _id: user._id,
                 name: user.name,
             },
             chat: chatId,
             createdAt: savedMessage.createdAt,
         };

        


         const membersSocket = getSockets([...members, user._id]);

         io.to(membersSocket).emit(NEW_MESSAGE, {
             chatId,
             message: messageForRealTime,
         })
         // start typing
        
         //  for alert (exclude sender)
         const membersWithoutSender = members.filter(
             (memberId) => memberId.toString() !== user._id.toString()
         );

         const alertSockets = getSockets(membersWithoutSender);

         io.to(alertSockets).emit(NEW_MESSAGE_ALERT, {
             chatId,
         });


     } catch (error) {
         console.error(error);
         socket.emit("ERROR", "Message not sent");
     }
   
    })


    // -------------------------------
    //       START TYPING
    // -------------------------------
    socket.on(START_TYPING, ({ members, chatId }) => {
       
        const senderId = socket.user._id.toString();
        const membersWithoutSender = members.filter(
            (id) => id.toString() !== senderId
        );

        const memberSockets = getSockets(membersWithoutSender);
        io.to(memberSockets).emit(START_TYPING, {chatId})
    })




    // -------------------------------
    //       STOP TYPING
    // -------------------------------

    socket.on(STOP_TYPING, ({ members, chatId }) => {
      
        const senderId = socket.user._id.toString();
        const membersWithoutSender = members.filter(
            (id) => id.toString() !== senderId
        );

        const memberSockets = getSockets(membersWithoutSender);
        io.to(memberSockets).emit(STOP_TYPING, { chatId })
    })


    // -------------------------------
    //  DISCONNECT
    // -------------------------------
    socket.on("disconnect", () => {
        userSocketIDs.delete(user._id.toString())
        onlineUsers.delete(user._id.toString());
        
    })
})

server.listen(port ,  ()=>{
    console.log(`app is listen on ${port}`)
})