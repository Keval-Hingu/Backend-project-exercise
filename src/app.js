import express from "express"
import cookieParser from "cookie-parser";
import cors from "cors"


export const app = express();

// To configures the middlewares we were using the use() method of the app .

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

// There are many types of data are requested and to set the limit of the data we use
// limit

app.use(express.json({
    limit : '16kb'
}))

// URL Encoding  :

app.use(express.urlencoded({
    extended : true ,
    limit : "16kb"
}))

//  Public folder  to stores the assets :

app.use(express.static("public"));

// For Cookies CRUD Operations :

app.use(cookieParser());


export {app}
