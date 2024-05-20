import dotenv from "dotenv";
import connect from "./db/index.js";
import app from "./app.js";


dotenv.config({
    path: './env'
});



connect()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running on port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log(err)

})















/*
import express from "express";
const app = express();

;(async()=>{

    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("Error",error)
        })

        app.listen(process.env.PORT,()=>{
            console.log(`Server is running on port ${process.env.PORT}`);
        })

    }
    catch(error){
        console.error(error)
    }
})()

*/