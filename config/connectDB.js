import mongoose from "mongoose"

export const db   = async() =>{
    try{
await mongoose.connect(process.env.URI)
console.log("database is connected successfully")
mongoose.connection.on('connected',()=>{
    console.log('db is connected')
})
    }
    catch(err){
        console.log(err)
    }
} 