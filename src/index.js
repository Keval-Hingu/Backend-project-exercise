// require('dotenv').config({path : './env'})

import dotenv from "dotenv"
import connectDB from "./db/index.js";

import { app } from "./app.js";

// Other way : Createing separate file and fucntion for that and call it .

dotenv.config({
    path: "./env"
})


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log("Server is running on the Port : " ,process.env.PORT);
    })
})
.catch((err) => {
    console.log("DATABASE Connection ERROR :" , err);
});























// Connecting the Databse 
// One way : 
// 1. Make Function :
// 2. Call the function :


// Second Way :
// /*
// import express from "express"
// import connectDB from "./db/index.js";
// import { configDotenv } from "dotenv";
// const app = express();
// (async ()=>{
//     try{
//         await mongoose.connect(`${process.env.DATABASE_URL}/${DB_NAME}`);

//         app.on("error" , ()=>{
//             console.log("ERROR : " , error);
//             throw error;
//         })

//         app.listen(process.env.PORT , ()=>{
//             console.log(`App is listening on PORT : ${process.env.PORT}`)
//         })
//     }
//     catch(error)
//     {
//         console.log("ERROR : " , error);
//         throw error;
//     }
// })()

// */