import express from 'express'
import { deleteChat, renameChat, getChatDetails, newGroup, getMyChats, getMyGroups, addMembers, message , removeMembers, deleteGroup, sendAttachments } from '../controllers/chatController.js'
import { verifyToken } from '../middlewares/auth.js'
import { newGroupChatValidater, 
    addMemberValidater,
    removeMemberHandler,
    leaveGroupValidator,
    sendAttachmentValidater,
    getMessageValidater,
    chatIdValidater,
    renameGroupValidater  ,
    validateHandler } from '../lib/validater.js'
import { attachmentsMulter } from '../config/multer.js'




const chatRoute = express.Router();

chatRoute.post('/newGroup', verifyToken, newGroupChatValidater(),validateHandler, newGroup);
chatRoute.get('/myChats', verifyToken , getMyChats);
chatRoute.get('/myGroups', verifyToken , getMyGroups);
chatRoute.put('/addMembers', verifyToken, addMemberValidater(),validateHandler, addMembers);
chatRoute.put('/removeMember', verifyToken, removeMemberHandler(), validateHandler , removeMembers);
chatRoute.put('/leaveGroup/:id', verifyToken, leaveGroupValidator() , validateHandler , deleteGroup);
// Send attachment
chatRoute.post('/message', verifyToken, attachmentsMulter, sendAttachmentValidater(), validateHandler , sendAttachments);
// GETTING CHAT DETAILS
chatRoute.get('/:id', verifyToken, chatIdValidater(),    validateHandler , getChatDetails);
chatRoute.put('/renameGroup/:id', verifyToken, renameGroupValidater () , validateHandler , renameChat);
chatRoute.delete('/deleteChat/:id', verifyToken, chatIdValidater(), validateHandler, deleteChat)
chatRoute.get('/getMessage/:id', verifyToken, getMessageValidater(), validateHandler  , message)
export default chatRoute