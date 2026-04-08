import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin'],
        
        trim: true
    },
    name:{
        type:String,
        required:true,
        trim: true,
    },
    username:{
        type:String,
        required:true,
        unique:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase: true,
        trim: true,
    },
    password:{
        type:String,
        required:false,
       
        
    },
    bio:{
        type:String,
        required:false,
        default: 'hi friends..',
    },
    avatar: {
        public_id: {
            type: String,
            required: false, // ✅ FIX
        },
        url: {
            type: String,
            required: true,
        },
    },
   
   
  
}, {
    timestamps: true,
}

)


export const User = mongoose.model("User",userSchema)