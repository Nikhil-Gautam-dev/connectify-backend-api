import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { createPost, deletePost, getSpecificPost, likeSpecificPost, searchPost, unlikeSpecificPost, updatePost } from "../controllers/post.controllers.js";

const postRouter = Router(); 


// create post
postRouter.route("/").post(
    upload.single("postImg"),
    verifyJWT,
    createPost
)

// update post
postRouter.route("/:postId").put(
    upload.single("postImg"),
    verifyJWT,
    updatePost
)

// delete post
postRouter.route("/:postId").delete(
    verifyJWT,
    deletePost
)

// specific post 

postRouter.route("/:postId").get(
    verifyJWT,
    getSpecificPost
)

// like a specific post
postRouter.route("/:postId/like").post(
    verifyJWT,
    likeSpecificPost
)

// unlike a specific post
postRouter.route("/:postId/like").delete(
    verifyJWT,
    unlikeSpecificPost
)

// search posts 
postRouter.route("/query/search/").get(
    verifyJWT,
    searchPost
)

export default postRouter