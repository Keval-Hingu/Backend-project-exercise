import { model, mongoose ,Schema,  } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema = Schema(
    {
        username : {
            type : String,
            unique : true,
            required : true,
            lowercase : true,
            trim : true,
            index : true  ///Searching purpose  
        } ,
        email : {
            type : String,
            required :  true ,
            index : true,
            lowercase : true ,
            trim : true,
            unique : true
        },
        fullname : {
            type : String,
            required :  true ,
            index : true,
            trim : true,
        },
        avatar : {
            type : String,
            required :  true , 
        },
        coverImage : {
            type : String
        },
        watchHistory : [
            {   type : Schema.Types.ObjectId,
                ref : "Video"
            }
        ],
        password : {
            type : String,
            required  : [true , "Password is Required "]
        },
        refreshToken : {
            type : String
        },
    },
    {
        timestamps : true
    }
)

userSchema.pre("save", async function(next){

    //when password is modified then it hashes the password and save.
    if(!this.isModified("password")) return next();

    // When password updated :
    this.password = bcrypt.hash(this.password , 10 );
    next();

})

// Password checking
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password , this.password)
}

// Adding Access and REfresh Token : 

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id : this._id,
            email :this.email,
            username : this.username,
            fullname : this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id : this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = model("User" , userSchema);

// JWT is a bearer Token : 