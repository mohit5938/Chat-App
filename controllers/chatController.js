import { Chat } from '../models/chatSchema.js'
import { User } from '../models/userSchema.js'
import { emitEvent } from '../utils/feature.js'
import { ALERT, REFETCH_CHATS,  NEW_MESSAGE } from "../constants/event.js";
import { uploadToCloudinary } from '../utils/uploadToCloudinary.js';
import { Message } from './../models/messageSchema.js';
import cloudinary from '../config/cloudinary.js'



export const newGroup = async (req, res) => {
    const { name, member } = req.body;

    try {
       
        if (member.length < 2) {
            return res.status(400).json({
                status: false,
                message: "Group must have atleast 3 members"
            })
        }

        const allMembers = [...member, req.user._id];

        const chat = await Chat.create({
            name,
            isGroupChat: true,
            creator: req.user,
            members: allMembers,
        })


        emitEvent(req, ALERT, allMembers, `wellcome to ${name} group`)
        emitEvent(req, REFETCH_CHATS, member)

        return res.status(200).json({
            status: true,
            message: "group created"
        })

    } catch (error) {

        return res.status(500).json({
            status: false,
            message: error.message || "Internal server error",
        });
    }

}


export const getMyChats = async (req, res) => {
    try {


        const getOtherMember = (members, userId) => {
            return members.find((member) => member._id.toString() !== userId.toString())
        }
        const chats = await Chat.find({
            members: req.user._id,
        }).populate("members", "name avatar")


        const transformChats = chats.map(({ _id, name, members, isGroupChat }) => {
            const otherMember = getOtherMember(members, req.user._id)
            return {
                _id,
                isGroupChat,
                avatar: isGroupChat
                    ? members
                        .slice(0, 3)
                        .map(m => m?.avatar?.url)
                        .filter(Boolean)   // 🔥 remove empty/null
                    : [otherMember?.avatar?.url].filter(Boolean),
                name: isGroupChat ? name : otherMember?.name || "Unknown User",
                members: members.reduce((prev, curr) => {
                    if (curr._id.toString() !== req.user._id.toString()) {
                        prev.push(curr._id)
                    }
                    return prev;
                }, [])

            }
        })

        return res.status(200).json({
            success: true,
            chats: transformChats,
        })

    }


    catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message || "Internal server error",
        });
    }
}

export const getMyGroups = async (req, res) => {
    try {
        const chats = await Chat.find({
            members: req.user._id,
            isGroupChat: true,
            
        }).populate("members", "avatar");
     
        const groups = chats.map(({ members, _id, isGroupChat, name }) => {

            const filteredMembers = members.filter(
                (m) => m._id.toString() !== req.user._id.toString()
            );

            return {
                _id,
                isGroupChat,
                name,

                avatar: filteredMembers
                    .slice(0, 3)
                    .map((m) => m.avatar?.url)
                    .filter(Boolean), // 🔥 fix

                membersCount: members.length, 
            };
        });
        return res.status(200).json({
            success: true,
            groups,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

export const addMembers = async (req, res) => {
    try {
        const { chatId, members } = req.body;

        if (!members || members.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide members to add",
            });
        }
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "chat not found"
            })
        }

        if (chat.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to add members"
            })
        }

        if (!chat.isGroupChat) {
            return res.status(404).json({
                success: false,
                message: "this is not a group chat"
            })
        }
        const NewMembers = members.map((i) => User.findById(i, "name"));

        const allNewMembers = (await Promise.all(NewMembers)).filter(Boolean);

        const uniqueMember = allNewMembers.filter((i) => !chat.members.includes(i._id.toString()))
            .map((i) => i._id)

        chat.members.push(...uniqueMember)

        await chat.save();

        const allUserName = allNewMembers.map((i) => i.name).join(",")

        emitEvent(req, ALERT, chat.members,
            `${allUserName} has been added in the group`
        )

        emitEvent(req, REFETCH_CHATS, chat.members)

        return res.status(200).json({
            success: true,
            message: "Members added successfully",
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}


export const removeMembers = async (req, res) => {
    try {
        const { userId, chatId } = req.body;
        // promise.all use to run parallel queries at same time , not sequentially , it return error if any error occurs
        const [chat, userThatWillBeRemoved] = await Promise.all([
            Chat.findById(chatId),
            User.findById(userId)
        ])

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "chat not found"
            })
        }
        if (!chat.isGroupChat) {
            return res.status(404).json({
                success: false,
                message: "this is not group chat"
            })
        }
        if (chat.creator.toString() !== req.user._id.toString()) {
            return res.status(404).json({
                success: false,
                message: "you can't allowed to remove members"
            })
        }
        // if (chat.members.length <= 3) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "group have atleast 3 members"
        //     })
        // }
        chat.members = chat.members.filter(
            (member) => member.toString() !== userId.toString()
        )
        await chat.save();
        emitEvent(req,
            ALERT,
            chat.members,
            `${userThatWillBeRemoved} has been removed from the group`
        )
        emitEvent(
            req,
            REFETCH_CHATS,
            chat.members,
        )
        return res.status(200).json({
            success: true,
            message: "member removed successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

export const deleteGroup = async (req, res) => {
    try {
        const chatId = req.params.id;
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "chat not found"
            })
        }
        if (!chat.isGroupChat) {
            return res.status(404).json({
                success: false,
                message: "this is not group chat"
            })
        }
        const remainingMembers = chat.members.filter(
            (m) => m.toString() !== req.user._id.toString()
        )
        if (remainingMembers.length === 0) {
            await chat.deleteOne();
            return res.status(200).json({
                success: true,
                message: "Group deleted"
            });
        }
        if (chat.creator.toString() === req.user._id.toString()) {
            const newCreator = remainingMembers[0];
            chat.creator = newCreator;
        }

        chat.members = chat.members.filter(
            (m) => m.toString() !== req.user._id.toString()
        )
        const [user] = await Promise.all([
            User.findById(req.user._id, "name"),
            chat.save(),
        ])
        emitEvent(req,
            ALERT,
            chat.members,
            `user ${user.name} has left the group`
        )
        return res.status(200).json({
            success: true,
            message: "Left group successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}


export const sendAttachments = async (req, res) => {
    try {
        const { chatId, content  } = req.body;
     

        const chat = await Chat.findById(chatId);
        const me = await User.findById(req.user._id, "name");
        const files = req.files || [];
        if (files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "no file is attached"
            })
        }
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "chat not found"
            })
        }

        const uploads = await Promise.all(
            req.files.map(file =>
                uploadToCloudinary(file.buffer, "chat-app")
            )
        )

        const attachments = uploads.map(u => (
            {
                public_id: u.public_id,
                url: u.secure_url,
            }
        ))

        //  Save in DB
        const newMessage = await Message.create({
            content: content || "",
            attachments,
            sender: me._id,
            chat: chatId,
        });
        console.log(newMessage)
        //  Prepare for realtime
        const messageForRealTime = {
            _id: newMessage._id,
            content: newMessage.content,
            attachments,
            sender: {
                _id: me._id,
                name: me.name,
            },
            chat: chatId,
            createdAt: newMessage.createdAt,
        };


       
      

        emitEvent(req, NEW_MESSAGE, chat.members, {
            chatId,
            message: messageForRealTime,
        });

        return res.status(200).json({
            success: true,
            message: newMessage,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }

}

export const getChatDetails = async (req, res) => {
    try {
        // we are using .populate to know that is user what to populate data or not like in chat we want memnbers details 
        if (req.query.populate?.toString() === "true") {
           // with lean method mongoose document is convert to plane js object and lighter than mongoose document 

            const chat = await Chat.findById(req.params.id).populate("members", "name avatar").lean()

            if (!chat) {
                return res.status(404).json({
                    success: false,
                    message: "chat not found"
                })
            }

            chat.members = chat.members.map(({ _id, name, avatar }) => (
                {
                    _id, name, avatar: avatar?.url
                }
            ))

            console.log(chat.members)
            return res.status(200).json({
                success: true,
                chat
            })

        }
        else {
            const chat = await Chat.findById(req.params.id).lean()
            if (!chat) {
                return res.status(404).json({
                    success: false,
                    message: "chat not found"
                })
            }
            return res.status(200).json({
                success: true,
                chat
            })
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

export const renameChat = async (req, res) => {
    try {
      
        const chatId = req.params.id;
        const { name } = req.body;
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "chat not found"
            })
        }
        if (!chat.isGroupChat) {
            return res.status(400).json({
                success: false,
                message: "this is not group chat"
            })
        }
        if (chat.creator.toString() !== req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "Only admin can change group name"
            })
        }
        chat.name = name;
        await chat.save();
        emitEvent(req, REFETCH_CHATS, chat.members)
        return res.status(200).json({
            success: true,
            message: `group name is changed to ${name}`
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

export const deleteChat = async (req, res) => {
    try {
        const chatId = req.params.id;
        console.log(chatId)
        const chat = await Chat.findById(chatId);
console.log(chat)
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "chat not found"
            })
        }

        if (chat.isGroupChat && chat.creator.toString() !== req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "Only admin can change group name"
            })
        }

        if (!chat.isGroupChat && !chat.members.includes(req.user._id.toString())) {
            return res.status(400).json({
                success: false,
                message: "you are not allowed to delete this group"
            }
            )
        }

        const messageWithAttachments = await Message.find({
            chat: chatId,
            attachments: { $exists: true, $ne: [] },
        })

        const public_ids = [];

        messageWithAttachments.forEach((message) => {
            message.attachments.forEach(({ public_id }) => {
                public_ids.push(public_id);
            });
        });
        await chat.deleteOne();
        await Message.deleteMany({ chat: chatId });
        if (public_ids.length > 0) {
            try {
                await cloudinary.api.delete_resources(public_ids);
            } catch (err) {
                console.log("Cloudinary error:", err);
            }
        }

        // await Promise.all([
        //     // delete files from cloudinary 
        //     cloudinary.api.delete_resources(public_ids),
        //     // chat.deleteOne(),
        //     // Message.deleteMany({ chat: chatId }),
        // ])

        emitEvent(req, REFETCH_CHATS, chat.members);

        return res.status(200).json({
            success: true,
            message: "chat deleted successfully"
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

export const message = async (req, res) => {
    const chatId = req.params.id;
    const { page = 1 } = req.query;

    const limit = 20;
    const skip = (page - 1) * limit;

    const [messages, totalMessageCount] = await Promise.all([
        Message.find({ chat: chatId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("sender", "name avatar")
            .lean(),
        Message.countDocuments({ chat: chatId }),
    ])

    const totalPages = Math.ceil(totalMessageCount / limit);

    return res.status(200).json({
        success: true,
        messages: messages.reverse(),
        totalPages,
    })

}