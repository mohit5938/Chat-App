import { User } from '../models/userSchema.js'
import { Chat } from '../models/chatSchema.js'
import { Request } from '../models/requestSchema.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { uploadToCloudinary } from '../utils/uploadToCloudinary.js';
import { NEW_REQUEST, REFETCH_CHATS } from '../constants/event.js'
import { emitEvent } from '../utils/feature.js'
export const register = async (req, res) => {
    const { name, username, email, password, bio } = req.body;

    try {
        if (!name || !username || !email || !password) {
            return res.json({
                success: false,
                message: "all fiels are not provided"
            })
        }
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ success: false, message: "user already exists" })
        }


        const result = await uploadToCloudinary(
            req.file.buffer,
            "chat-app"
        );
        const avatar = {
            public_id: result.public_id,
            url: result.secure_url,
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User({ name, username, email, password: hashedPassword, avatar, bio })
        if (!user) {
            return res.status(400).json({ success: false, message: "user is not registered" })
        }
        await user.save();
        return res.status(200).json({
            success: true,
            message: "user is registerd",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            }
        })
    }
    catch (err) {
        res.send({
            success: false,
            message: err.message
        })
    }


}

export const login = async (req, res) => {

    try {


        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send({
                success: false,
                message: "all fiels are not provided"
            })
        }

        const user = await User.findOne({ email })

        if (!user) {
            return res.send({
                success: false,
                message: "user is not registered"
            })
        }
        if (!user.password) {
            return res.status(400).json({
                message: "Please login using Google ",
            });
        }
        const hashedPassword = user.password;
        const comparePassword = await bcrypt.compare(password, hashedPassword)
        if (!comparePassword) {
            return res.json({
                success: false,
                message: "password is wrong",
            })
        }
        const token = jwt.sign({
            _id: user._id,
            role: user.role,
            name: user.name,
            email: user.email,
            avtar: user.avatar,
            bio: user.bio,
        }, process.env.JWT_SECRET, { expiresIn: '1d' })

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/",
            maxAge: 24 * 60 * 60 * 1000
        })
        const newUser = user.toObject({ getters: true })
        delete newUser.password
        return res.json({
            success: true,
            user: newUser,
            message: "user is logged in",
        })

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const googleLogin = async (req, res) => {
    try {
        const { name, username, email, avatar } = req.body;
        let user
        user = await User.findOne({ email })
        if (!user) {

            const newUser = new User({
                name,
                username,
                email,
                password: null,
                avatar: {
                    url: avatar,
                    public_id: "google",
                }
            })
            user = await newUser.save();
        }

        const token = jwt.sign({
            _id: user._id,
            role: user.role,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
        }, process.env.JWT_SECRET, { expiresIn: '1d' })

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/",
            maxAge: 24 * 60 * 60 * 1000

        })

        const nUser = user.toObject({ getters: true })
        delete nUser.password
        return res.json({
            success: true,
            user: nUser,
            message: "user is logged in"
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000,
            path: "/",
        });
        return res.status(200).json({
            success: true,
            message: "user is logged out"
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const getProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select("-password")

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "user not found",
            })
        }

        res.status(200).json({
            success: true,
            user,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export const SearchUser = async (req, res) => {
    try {
        const { name = "" } = req.query;

        const myChats = await Chat.find({
            isGroupChat: false,
            members: req.user._id
        })

        const allusersFromMyChats = myChats.flatMap((chat) =>
            chat.members.filter(
                (member) => member.toString() !== req.user._id.toString()
            )
        );

        const users = await User.find({
            _id: {
                $nin: [...allusersFromMyChats, req.user._id], // ✅ exclude friends + self
            },
            name: { $regex: name, $options: "i" },
        });

        const formattedUsers = users.map(({ _id, name, avatar }) => ({
            _id,
            name,
            avatar: avatar.url,
        }));

        return res.status(200).json({
            success: true,
            users: formattedUsers,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }


}

export const sendFriendRequest = async (req, res) => {

    try {

        const { userId } = req.body;

        const request = await Request.findOne({
            $or: [
                { sender: req.user._id, receiver: userId },
                { sender: userId, receiver: req.user._id }
            ]
        });

        if (request) {
            return res.status(400).json({
                success: false,
                message: "request already sent"
            })
        }
        await Request.create({
            sender: req.user._id,
            receiver: userId
        })

        emitEvent(req, NEW_REQUEST, [userId]);

        return res.status(200).json({
            success: true,
            message: "friend Request sent"
        });


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export const acceptRequest = async (req, res) => {
    try {
        const { reqId, accept } = req.body;
        const request = await Request.findById(reqId)
            .populate("sender", "name ")
            .populate("receiver", "name")

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "request not found"
            })
        }

        if (request.receiver._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: "you can't accept request  "
            })
        }

        if (!accept) {
            await Request.findByIdAndDelete(reqId);
            return res.status(200).json({
                success: true,
                message: "friend request delete successfully  "
            })
        }
        const members = [request.sender._id, request.receiver._id]
        await Promise.all([
            Chat.create({
                members,
                name: `${request.sender.name}-${request.receiver.name}`,
                creator: req.user._id,
            })
            ,
            request.deleteOne()
        ])

        emitEvent(req, REFETCH_CHATS, members);
        return res.json({
            success: true,
            message: "freind Request accepted",
            senderId: request.sender._id
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export const getNotification = async (req, res) => {
    try {
        const requests = await Request.find({
            receiver: req.user._id,

        }).populate("sender", "name avatar")

        if (!requests) {
            return res.status(400).json({
                success: false,
                message: "no request found",
            });
        }
        const allRequests = requests.map(({ _id, sender }) => (
            {
                _id,
                sender: {
                    _id: sender._id,
                    name: sender.name,
                    avatar: sender.avatar.url,

                }
            }
        ))
        return res.status(200).json({
            success: true,
            notifications: allRequests
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export const getFriends = async (req, res) => {
    try {
        const chatId = req.query.chatId;

        const chats = await Chat.find({
            members: req.user._id,
            isGroupChat: false,
        })
            .populate("members", "name avatar")
        const friends = chats.map(({ members }) => {

            const otherUser = members.find(
                (member) =>
                    member._id.toString() !== req.user._id.toString()
            );

            if (!otherUser) return null;

            return {
                _id: otherUser._id,
                name: otherUser.name,
                avatar: otherUser.avatar?.url,
            };

        }).filter(Boolean);

        //Remove duplicates globally
        const uniqueFriends = [
            ...new Map(
                friends.map(friend =>
                    [friend._id.toString(), friend]
                )
            ).values()
        ];

        if (chatId) {
            const chat = await Chat.findById(chatId).populate("members", "name avatar")

            const memberIds = chat.members.map(m => m._id.toString());

            const availableFriends = uniqueFriends.filter(
                (friend) => !memberIds.includes(friend._id.toString())
            );

            return res.status(200).json({
                success: true,
                availableFriends,
            });
        }

        return res.status(200).json({
            success: true,
            uniqueFriends,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}