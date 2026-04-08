import express from 'express'
import {
    getAllUser,
    getAllChats,
    getAllMessages,
    getDashBoardStats,
    adminLogin,
    adminLogut,
} from '../controllers/adminController.js'
import { adminValidator, validateHandler  } from '../lib/validater.js'


const adminRoute = express.Router();

adminRoute.post('/adminLogin', adminValidator(), validateHandler, adminLogin)
adminRoute.get('/adminLogout',adminLogut)
adminRoute.get('/users', getAllUser)
adminRoute.get('/chats', getAllChats)
adminRoute.get('/messages',getAllMessages)
adminRoute.get('/stats',getDashBoardStats)

export default adminRoute;