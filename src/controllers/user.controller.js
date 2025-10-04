import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async(userId) => {
    // find the user
    // generate the tokens
    // set the tokens to the user document and save
    // returns the tokens
    try {

        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken()
        
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave : false});
        // console.log("Access Token in Generator fn:: ",accessToken);
        // console.log("Refresh Token in generator fn ::",refreshToken);
        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500,"Error while generating access token and refresh tokens.");
    }
}


const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    // get user details from frontend
    const {username, email, password,fullName } = req.body
    // console.log("email: ", email);
    // console.log("username: ", username);

    // validation - not empty
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    // console.log("Files Object ",req.files);
    
    
    // check for images, check for avatar::
    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path;
    }
    
    //avatarLocalPath = req?.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    // console.log("Avatar local path :",avatarLocalPath);
    // console.log("coverImage local path :",coverImageLocalPath);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
    
    
    //  create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })
    
    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    // check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    
    // return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
    
});

const loginUser = asyncHandler(async(req,res)=>
{
    // 1.data <- req.body
    // 2.verify user based on username or email
    // 3.find the user based on email or username
    // 4.verify password
    // 5.generate accessToken and refresh tokens
    // 6.save the tokens in cookies

    const {username, email , password} = req.body;
    console.log("username", username);
    console.log("password", password);
    // one of the field is required
    // if([username,email].every((field)=>field?.trim()===""|| field===undefined))
    // {
    //     throw new ApiError(400,"Username or email is Required");
    // }
    
    if(!username && !email)
    {
        throw new ApiError(400,"Username or email is Required");
    }

    // 2.find the user::
    const user = await User.findOne({
        $or : [{username},{email}]
    });

    if(!user){ throw new ApiError(404,"User does not exist in the Database.");}

    // 3.check the password
    const isPassswordValid = await user.isPasswordCorrect(password);
    if(!isPassswordValid) { throw new ApiError(401, "Invalid user Credentials." );}

    // 4.generate the tokens:
    const {accessToken,refreshToken} = await generateAccessTokenAndRefreshToken(user._id);

    // console.log("Access Token",accessToken);
    // console.log("Refresh Token",refreshToken);


    // 5.find the loggedIn user and select the fields to return and save to the cookie
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // cookie options : only modified by the server:
    const options = {
        secure : true, //
        httpOnly : true, // only server can modify 
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken", refreshToken,options)
    .json(new ApiResponse(
        200,
        {
            user:loggedInUser,
            accessToken,
            refreshToken
        },
        "User Logged In successfully"
    ));
});

const logoutUser = asyncHandler( async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset : {
                refreshToken : 1
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged Out!"));
});

const refreshAccessToken = asyncHandler( async(req,res)=>{
    // take refreshtoken from cookies or body or header
    // verify the refresh token --decode 

    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken || req.header("Authorization").replace("Bearer ","");

    // console.log("Incoming refresh token",incomingRefreshToken);

    if(!incomingRefreshToken)
    {
        throw new ApiError(401,"Unauthorized Request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if(!user) throw new ApiError(401,"Invalid Refresh Token");

        if(incomingRefreshToken !== user?.refreshToken)
        {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly : true,
            secure: true
        };

        const { accessToken , refreshToken : newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id);

        // console.log("New Access token",accessToken);
        // console.log("New Refresh token", newRefreshToken);

        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(new ApiResponse(
            200,
            {
                accessToken,
                refreshToken : newRefreshToken,
            },
            "Access Token refreshed"
        ));
        
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token");
    }
})

const changeCurrentPassword = asyncHandler( async(req,res)=>{
    const { oldPassword, newPassword , confirmNewPassword} = req.body;
    const user = await User.findById(req.user._id);
    const isPassswordValid = await user.isPasswordCorrect(oldPassword);
    
    // console.log("Password Correctness :",isPassswordValid);

    if(!isPassswordValid)
    {
        throw new ApiError(400,"Invalid Old Password.");
    }

    if(newPassword.trim()==="" || confirmNewPassword.trim()==="")
    {
        throw new ApiError(400,"New Password and Confirm Password should not be empty.");
    }
    
    if( newPassword!==confirmNewPassword)
    {
        throw new ApiError(400,"New Password and Confirm Password should be same.");
    }

    user.password = newPassword;

    await user.save({validateBeforeSave : false});

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password updated successfully."));
});

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "User Fetched Successfully."
        )
    );
});

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const { fullName , email } = req.body;

    console.log("FullName",fullName);
    console.log("email",email);
    if(!fullName || !email)
    {
        throw new ApiError(400,"Both Fields are required for updation");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                fullName,
                email
            }
        },
        { new : true}
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Account Details Updated Successfully."
    ));
});

// middleware used: multer
const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath)
    {
        throw new ApiError(400,"Avatar file is missing.. ");
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    
    if(!avatar.url)
    {
        throw new ApiError(400,"Error Uploading avatar file to the Cloudinary.. ");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar: avatar.url
            }
        },
        {new : true}
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar Image Updated Successfully.."
        )
    );

});

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath)
    {
        throw new ApiError(400,"Cover Image file is missing.. ");
    }
    
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    
    if(!coverImage.url)
    {
        throw new ApiError(400,"Error Uploading Cover Image file to the Cloudinary.. ");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverImage: coverImage.url
            }
        },
        {new : true}
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Cover Image Updated Successfully.."
        )
    );

});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}