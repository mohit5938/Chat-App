import { User } from "../models/userSchema.js";
import { Chat } from "../models/chatSchema.js";
import { faker, simpleFaker } from "@faker-js/faker";
import { Message } from "../models/messageSchema.js";

export const createSingleChats = async (numChats) => {
    try {
        // Get only user IDs
        const users = await User.find().select("_id");

        const chatsPromise = [];

        // Create 1-to-1 chats between users
        for (let i = 0; i < users.length; i++) {
            for (let j = i + 1; j < users.length; j++) {
                chatsPromise.push(
                    Chat.create({
                        name: faker.lorem.words(2),
                        isGroupChat: false, // ✅ added (important)
                        members: [users[i]._id, users[j]._id], // ✅ use _id
                    })
                );

                // ✅ Optional: stop after reaching numChats limit
                if (numChats && chatsPromise.length >= numChats) break;
            }

            if (numChats && chatsPromise.length >= numChats) break;
        }

        await Promise.all(chatsPromise);

        console.log(`${chatsPromise.length} chats created successfully ✅`);
    } catch (error) {
        console.error("Error creating chats:", error);
    }
};


export const createGroupChats = async (numChats) => {
    try {
        const users = await User.find().select("_id");

        if (users.length < 3) {
            throw new Error("Not enough users to create group chats");
        }

        const chatsPromise = [];

        for (let chatIndex = 0; chatIndex < numChats; chatIndex++) {
            // Random group size (min 3 members)
            const numMembers = simpleFaker.number.int({
                min: 3,
                max: users.length,
            });

            const members = [];
            const usedIndexes = new Set(); // ✅ prevents duplicate users

            while (members.length < numMembers) {
                const randomIndex = Math.floor(Math.random() * users.length);

                if (!usedIndexes.has(randomIndex)) {
                    usedIndexes.add(randomIndex);
                    members.push(users[randomIndex]._id);
                }
            }

            chatsPromise.push(
                Chat.create({
                    name: faker.lorem.words(2),
                    isGroupChat: true,
                    members,
                    creator: members[0], // ✅ assign first member as creator
                })
            );
        }

        await Promise.all(chatsPromise);

        console.log(`${numChats} group chats created successfully ✅`);
    } catch (error) {
        console.error("Error creating group chats:", error);
    }
};


export const createMessages = async (numMessages) => {
    try {
        const users = await User.find().select("_id");
        const chats = await Chat.find().select("_id");

        if (users.length === 0 || chats.length === 0) {
            throw new Error("Users or chats not found");
        }

        const messagesPromise = [];

        for (let i = 0; i < numMessages; i++) {
            const randomUser =
                users[Math.floor(Math.random() * users.length)]._id;

            const randomChat =
                chats[Math.floor(Math.random() * chats.length)]._id;

            messagesPromise.push(
                Message.create({
                    chat: randomChat,
                    sender: randomUser,
                    content: faker.lorem.sentence(),
                })
            );
        }

        await Promise.all(messagesPromise);

        console.log("Messages created successfully ✅");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

export const createMessagesInChat = async (chatId, numMessages) => {
    try {
        // Get all users (only IDs)
        const users = await User.find().select("_id");

        if (!chatId) {
            throw new Error("chatId is required");
        }

        if (users.length === 0) {
            throw new Error("No users found");
        }

        const messagesPromise = [];

        for (let i = 0; i < numMessages; i++) {
            const randomUser =
                users[Math.floor(Math.random() * users.length)]._id;

            messagesPromise.push(
                Message.create({
                    chat: chatId,
                    sender: randomUser,
                    content: faker.lorem.sentence(),
                })
            );
        }

        await Promise.all(messagesPromise);

        console.log("Messages created successfully ✅");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};