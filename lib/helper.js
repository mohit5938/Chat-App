import {userSocketIDs} from '../app.js'
export const getSockets = (users = []) => {
    return users
        .map((user) => {
            const userId = typeof user === "object" ? user?._id : user;
            return userSocketIDs.get(userId.toString());
        })
        .filter(Boolean);
};