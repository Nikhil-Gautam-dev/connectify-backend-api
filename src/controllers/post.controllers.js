import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Post } from "../models/post.models.js";
import { User } from "../models/user.models.js";

const uploadPostImg = async function (postImgLocalPath) {
  if (!postImgLocalPath) {
    return "";
  }

  const postImg = await uploadOnCloudinary(postImgLocalPath);

  return postImg;
};

const createPost = asyncHandler(async (req, res) => {
  const { title, content, tags } = req.body;

  if (!title) {
    throw new ApiError(400, "title is required");
  }

  if (!content) {
    throw new ApiError(400, "content is required");
  }

  const postImgLocalPath = req.file?.path;

  const postImg = await uploadPostImg(postImgLocalPath);

  const newPost = await Post.create({
    title,
    content,
    createdby: req.user.username,
    tags: tags || [],
    postImgUrl: postImg?.url || "",
  });

  const newPostCreated = await Post.findById(newPost._id);

  User.findByIdAndUpdate(req.user._id, {
    $push: {
      posts: newPostCreated._id,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newPostCreated, "post created successfully"));
});

const updatePost = asyncHandler(async (req, res) => {
  const { title, content, tags } = req.body;

  const postImgLocalPath = req.file?.path;

  if (!title && !content && !tags && !postImgLocalPath) {
    return res.status(400).json(new ApiResponse(400, "", "nothing to update"));
  }

  const post = await Post.findById(req.params?.postId);

  if (!post) {
    throw new ApiError(404, "post with given id doesn't exist!");
  }

  const postImg = await uploadPostImg(postImgLocalPath);

  const updatedPost = await Post.findByIdAndUpdate(post._id, {
    $set: {
      title: title || post.title,
      content: content || post.content,
      postImgUrl: postImg?.url || post.postImgUrl,
    },
    $push: {
      tags: tags,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPost, "post updated successfully"));
});

const deletePost = asyncHandler(async (req, res) => {
  const postId = req.params?.postId;
  if (postId) {
    const post = await Post.findById(postId);

    if (!post) {
      throw new ApiError(404, "post with given id doesn't exist");
    }

    await Post.findByIdAndDelete(postId);

    return res
      .status(200)
      .json(new ApiResponse(200, "", "post deleted successfully"));
  }

  throw new ApiError(400, "id is required !");
});

const getSpecificPost = asyncHandler(async (req, res) => {
  const postId = req.params?.postId;

  if (postId) {
    const post = await Post.findById(postId);

    if (!post) {
      throw new ApiError(404, "post with given id doesn't exist");
    }

    return res.status(200).json(new ApiResponse(200, post));
  }
  throw new ApiError(400, "id is required !");
});

const likeSpecificPost = asyncHandler(async (req, res) => {
  const postId = req.params?.postId;

  if (postId) {
    const post = await Post.findById(postId);

    if (!post) {
      throw new ApiError(404, "post with given id doesn't exist");
    }

    await Post.findByIdAndUpdate(postId, {
      $addToSet: {
        likes: { $each: [req.user._id] },
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "", "post liked successfully"));
  }

  throw new ApiError(400, "post id is required!");
});

const unlikeSpecificPost = asyncHandler(async (req, res) => {
  const postId = req.params?.postId;

  if (postId) {
    const updatedPost = await Post.findByIdAndUpdate(postId, {
      $pull: {
        likes: req.user._id,
      },
    });

    if (updatedPost.nmodified == 0) {
      throw new ApiError(404, "post with id not found!");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "", "unliked post successfully"));
  }
  throw new ApiError(400, "id is required!");
});

const searchPost = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  let title = req.query?.title;
  let content = req.query?.content;
  const tags = req.query?.tags;
  const creator = req.query?.creator;

  let queryObject = {};

  if (title) {
    queryObject.title = { $regex: title, $options: "i" };
  }

  if (content) {
    queryObject.content = { $regex: content, $options: "i" };
  }

  if (tags) {
    queryObject.tags = { $in: tags };
  }

  if (creator) {
    queryObject.createdby = creator;
  }

  const posts = await Post.find(queryObject)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalPosts = await Post.countDocuments();
  return res.status(200).json({
    page,
    limit,
    totalPosts,
    totalPages: Math.ceil(totalPosts / limit),
    posts,
  });
});

export {
  createPost,
  updatePost,
  deletePost,
  getSpecificPost,
  likeSpecificPost,
  unlikeSpecificPost,
  searchPost,
};
