import { Chat } from '../models/chatSchema.js'
import { User } from '../models/userSchema.js'
import { Message } from './../models/messageSchema.js'
import jwt from "jsonwebtoken"


export const adminLogin = async( req , res ) => {
    try {
        const {secretKey} = req.body;

        const adminSecretKey = process.env.ADMIN_SECRET_KEY

        const isMatch = secretKey === adminSecretKey
        if( !isMatch){
            return res.status(401).json({
                success: false,
                message: "invalid admin key"
            })
        }

        const token = jwt.sign(secretKey,process.env.JWT_SECRET)
return res.status(200).cookie("adminToken",token,{
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000
}).json({
    success: true,
    message: "Authenticated Successfully,well Boss"
})
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message || "Internal server error",
        });
    }
}

export const adminLogut = async( req , res ) => {
    try {
        return res.status(200).cookie("adminToken","",{
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 0,
        }).json({
            success: true,
            message: "Logged out success-fully "
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message || "Internal server error",
        });
    }
}
export const getAllUser =  async( req , res ) =>{
    try {
        const users = await User.find({}).select("-password");

        const transformedUser = await Promise.all(
            users.map(async ({ name, username, avatar, _id, createdAt }) => {

                const [groups, friends] = await Promise.all([
                    Chat.countDocuments({ isGroupChat: true, members: _id }),
                    Chat.countDocuments({ isGroupChat: false, members: _id })
                ]);

                return {
                    name,
                    username,
                    avatar: avatar?.url,
                    _id,
                    groups,
                    friends,
                    createdAt,
                };
            })
        );
        return res.json({
            success: true,
            users: transformedUser
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message || "Internal server error",
        });
    }
}

export const getAllChats = async (req, res) => { 
    try {
        const chats = await Chat.find({})
        .populate("members","name avatar")
        .populate("creator","name avatar")

        const transformedChats = await Promise.all(
            chats.map(async ({ members, _id, isGroupChat, name, creator }) => {

                const totalMessages = await Message.countDocuments({ chat: _id });

                return {
                    _id,
                    isGroupChat,
                    name,
                    avatar: members.slice(0, 3).map(
                        (member) => member.avatar?.url
                    ),
                    members: members.map(({ _id, name, avatar }) => ({
                        _id,
                        name,
                        avatar: avatar?.url || ""
                    })),
                    creator: {
                        name: creator?.name || "None",
                        avatar: creator?.avatar?.url || ""
                    },
                    totalMembers: members.length,
                    totalMessages
                };
            })
        );

        return res.json({
            success: true,
            chats: transformedChats ,
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message || "Internal server error",
        });
    }
}

export const getAllMessages = async (req, res) => {
    try {
        const messages = await Message.find({})
        .populate("sender","name avatar")
        .populate("chat","isGroupChat ")

        const transformMessage = messages.map((msg) => {
            const { content, _id, attachments, sender, createdAt, chat } = msg;

            return {
                _id,
                attachments,
                content,
                createdAt,

                // ✅ SAFE ACCESS (MAIN FIX)
                chat: chat?._id || null,
                isGroupChat: chat?.isGroupChat || false,

                sender: {
                    _id: sender?._id,
                    name: sender?.name || "Unknown",
                    avatar: sender?.avatar?.url || null, // ✅ FIX NAME
                }
            };
        });
        
        return res.json({
            success: true,
            messages: transformMessage
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status: false,
            message: error.message || "Internal server error",
        });
    }
}


export const getDashBoardStats = async(req , res ) => {
    try {
        const [groupCount, individualChatsCount ,  usersCount , messageCount , totalChatCount] = 
        await Promise.all([
            Chat.countDocuments({isGroupChat: true}),
            Chat.countDocuments({isGroupChat: false}),
            User.countDocuments(),
            Message.countDocuments(),
            Chat.countDocuments(),

        ]) 

        const stats ={
            groupCount, 
            individualChatsCount,
            usersCount,
            messageCount, 
            totalChatCount,

        }

        const today = new Date();
        let last7days = new Date();
        last7days.setDate(last7days.getDate() - 7 );

        const last7DaysMessages = await Message.find({
            createdAt: {
                $gte : last7days,
                $lte: today,
            }
        }).select("createdAt")

        const messages = new Array(7).fill(0);
        const dayInMilliseconds = 1000 * 60 * 60 * 24;

        last7DaysMessages.forEach((message) => {
            const messageDate = new Date(message.createdAt);
            messageDate.setHours(0, 0, 0, 0);

            const diff =
                (messageDate.getTime() - last7days.getTime()) /
                dayInMilliseconds;

            const index = Math.floor(diff);
             if (index >= 0 && index < 7) {
                 messages[index]++;
             }
         })

        return res.status(200).json({
            success: true,
            stats  ,
            messages,
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message || "Internal server error",
        });
    }
}