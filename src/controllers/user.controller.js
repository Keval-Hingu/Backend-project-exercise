import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/User.model.js";

const registerUser = asyncHandler( async (req,res) => {
    // res.status(500).json({
    //     message : "OK"
    // })

    // user detail frontend
    // username , password unko hash or securely store karna
    // database se connection 
    // kuch middlewares 

    // get user details from frontend 
    // validation - not empty

    const { fullname , email , password , username } = req.body;
    console.log(fullname);
    console.log(username);
    console.log(email);

    // Validation :

    if (
        [fullname , username , email , password ].some( (field) => field?.trim()=== "")
    ){
        throw new ApiError(400 , "All Fields are Required");
    }

    // Check if user is already exists : 

    const existedUser = User.findOne({
        $or : [{username} , {email}]
    })

    if(existedUser) {
        throw new ApiError(409 , "User is already exist with same usernmae or email");
    }

    //  Check for avatar and coverImage
    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required") 
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required") 
    }

    // Adding user to the Databse

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    }) 

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})


export {registerUser}