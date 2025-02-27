import mongoose from "mongoose";

import { DB_NAME } from "../constants.js";

const connectDB  = async ()=>{
    try {
       const ConnectionInstance = await mongoose.connect(`${process.env.DATABASE_URL}/${DB_NAME}`);
       console.log("MongoDB Connected !! DB HOST : ", ConnectionInstance.connection.host);
    } catch (error) {
        console.log(`MONGODB connection ERROR : ${error}`);
        process.exit(1);
    }
}


export default connectDB;