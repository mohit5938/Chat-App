import { getSockets } from '../lib/helper.js'

export const emitEvent = (req, event ,users ,  data ) =>{
const io = req.app.get("io");
const userSocketId = getSockets(users);
io.to(userSocketId).emit(event , data)
}



