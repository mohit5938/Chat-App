import mongoose from 'mongoose'


const ChatSchema = new mongoose.Schema({
name:{
    type:String,
    required:true
},
isGroupChat:{
    type:Boolean,
    default:false,
},
creator:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User"
},
members:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
]
},
{
    timestamps:true,
}
)

export const Chat = mongoose.model("Chat",ChatSchema)