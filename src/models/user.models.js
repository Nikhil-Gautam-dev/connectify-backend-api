import mongoose from "mongoose";
import bcrypt, { hash } from "bcrypt"; 
import jwt  from "jsonwebtoken";


const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      lowercase: true,
    },
    gender: {
      type: String,
      enum: ["M", "F", "O"],
      required: true,
    },
    avatar: {
      type: String
    },
    refreshToken:String,
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
    return next();
  }
  return next();
});

userSchema.methods.isPasswordCorrect = async function(password){
  return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = async function(){
  return await jwt.sign(
    {
        _id:this._id, 
        email:this.email, 
        username:this.username, 
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY, 
    }
)
}

userSchema.methods.generateRefreshToken = async function(){
  return await jwt.sign(
    {
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,

    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const User = mongoose.model("User", userSchema);
