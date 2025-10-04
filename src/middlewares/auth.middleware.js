import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";

export const verifyJWT = asyncHandler( async (req , res , next) => {
    // 1. take the token from cookies or headers
    // 2. decode the token information
    // 3. find the user based on the information from decoded token
    // 4. set the user to the request for further use
    try {

        // get the token from logggedIn user
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        
        if(!token) throw new ApiError(401, "Unauthorized Token");

        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-refreshToken -password");

        if(!user) throw new ApiError(401,"Invalid Access Token");

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Token");
    }
})


