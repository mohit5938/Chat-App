import express from 'express'
import { singleAvatar } from '../config/multer.js'
import { register, 
    login, 
    logout, 
    googleLogin, 
    getProfile ,
    sendFriendRequest,
    acceptRequest,
    getNotification,
    getFriends,
     SearchUser,
    } from '../controllers/userController.js'
import { verifyToken } from './../middlewares/auth.js';
import { validateHandler, reqValidator  , registerValidater, sendReqValidator , loginValidater } from '../lib/validater.js';

const userRouter = express.Router();


userRouter.post('/register', singleAvatar, registerValidater(), validateHandler , register);
userRouter.post('/login',loginValidater(),validateHandler ,login)
userRouter.post('/googleLogin',googleLogin)
userRouter.post('/logout',logout)
userRouter.get('/getUser', verifyToken, getProfile)
userRouter.get('/searchUser',verifyToken,SearchUser)

userRouter.put('/acceptRequest', verifyToken, acceptRequest)
userRouter.get('/notification', verifyToken, getNotification)

userRouter.put('/sendFriendRequest', verifyToken, sendReqValidator(), validateHandler,  sendFriendRequest)

userRouter.get('/friends', verifyToken, getFriends)
export default userRouter;