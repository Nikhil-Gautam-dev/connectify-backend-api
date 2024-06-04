import { Router } from "express";
import { findUser, followOtherUser, loginUser, logoutUser, registerUser, searchUser, unFollowOtherUser, updateAvatar, updateBio, userInfo } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";


const userRouter = Router() 


// register users 
userRouter.route("/auth/signup").post(
    upload.single("avatar"),
    registerUser)

// login users 
userRouter.route("/auth/login").post(loginUser) 

// protected routes 

// logout user 
userRouter.route("/auth/logout").post(verifyJWT,logoutUser)


// info route
userRouter.route("/").get(verifyJWT,userInfo)

userRouter.route("/:id").get(verifyJWT,userInfo)
userRouter.route("/query/find").get(verifyJWT,findUser)


// update routes 

userRouter.route("/avatar").put(
    upload.single("avatar"), 
    verifyJWT,
    updateAvatar
)

userRouter.route("/bio").put(
    verifyJWT,
    updateBio
)

userRouter.route("/id/:id/follow").post(
    verifyJWT,
   followOtherUser
)
userRouter.route("/username/:username/follow").post(
    verifyJWT,
   followOtherUser
)


userRouter.route("/id/:id/follow").delete(
    verifyJWT,
    unFollowOtherUser
)
userRouter.route("/username/:username/follow").delete(
    verifyJWT,
   unFollowOtherUser
)



userRouter.route("/query/search").get(searchUser)

export default userRouter