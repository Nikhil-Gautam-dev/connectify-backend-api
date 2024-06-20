import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (user_id) => {
  try {
    const user = await User.findById(user_id);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access and refresh tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, gender } = req.body;

  if (
    [username, email, password, gender].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "[username,email,password,gender] are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "user already exist");
  }

  const avatarLocalPath = req.file?.path;

  let avatar = "";

  if (avatarLocalPath) {
    avatar = await uploadOnCloudinary(avatarLocalPath);
  }

  const user = await User.create({
    username,
    email,
    password,
    gender,
    bio: "This is your bio section you can edit it !",
    avatar: avatar?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(
      500,
      "something went wrong while registering the user !"
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registerd successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user with given credentials doesn't exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          expiry: (1 * 24 * 60 * 60).toString(),
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
        "user logged in sucesfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user_id, {
    $set: {
      refreshToken: undefined,
    },
  });

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({
      message: "user logged out successfully",
    });
});

const userInfo = asyncHandler(async (req, res) => {
  if (req.params?.id) {
    const user = await User.findById(req.params.id).select(
      "-password -refreshToken -createdAt -updatedAt -__v"
    );

    if (!user) {
      throw new ApiError(404, "user not found!");
    }

    return res.status(200).json({
      message: "success",
      data: user,
    });
  } else {
    return res.status(200).json({
      message: "success",
      data: {
        user: req.user.username,
        email: req.user.email,
        gender: req.user.gender,
        avatar: req.user.avatar,
        followers: req.user.followers,
        posts: req.user.posts,
      },
    });
  }
});

const findUser = asyncHandler(async (req, res) => {
  const username = req.query.username;
  const id = req.query.id;

  if (!username && !id) {
    throw new ApiError(400, "username or id is rrequired");
  }

  const user = await User.find({
    $or: [{ username }, { _id: id }],
  }).select("-password -refreshToken -createdAt -updatedAt -__v");

  if (!user) {
    throw new ApiError(400, "user doesn't exist!");
  }

  return res.status(200).json({
    message: "success",
    data: user,
  });
});
const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(404, "Avatar image not provided");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  await User.findByIdAndUpdate(req.user._id, {
    $set: {
      avatar: avatar?.url,
    },
  });

  return res.status(200).json({
    message: "avatar updated",
  });
});

const followOtherUser = asyncHandler(async (req, res) => {
  if (req.params?.id) {
    if (req.params.id == req.user._id) {
      throw new ApiError(400, "can't be followed");
    }
    await User.findByIdAndUpdate(req.params.id, {
      $push: {
        followers: req.user._id,
      },
    });
  } else if (req.params?.username) {
    if (req.params.username == req.user.username) {
      throw new ApiError(400, "can't be followed");
    }
    await User.findOneAndUpdate(
      { username: req.params?.username },
      {
        $push: {
          followers: req.user._id,
        },
      }
    );
  }

  return res.status(200).json({
    message: "followed successfuly",
  });
});

const unFollowOtherUser = asyncHandler(async (req, res) => {
  if (req.params?.id) {
    if (req.params.id == req.user._id) {
      throw new ApiError(400, "can't be unfollowed");
    }
    await User.findByIdAndUpdate(req.params.id, {
      $pull: {
        followers: req.user._id,
      },
    });
  } else if (req.params?.username) {
    if (req.params.username == req.user.username) {
      throw new ApiError(400, "can't be followed");
    }
    await User.findOneAndUpdate(
      { username: req.params?.username },
      {
        $pull: {
          followers: req.user._id,
        },
      }
    );
  }

  return res.status(200).json({
    message: "unfollowed successfuly",
  });
});

const searchUser = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  const username = req.query?.username;
  const gender = req.query?.gender;

  const queryObject = {};

  if (username) {
    queryObject.username = { $regex: username, $options: "i" };
  }
  if (gender) {
    queryObject.gender = { $regex: gender, $options: "i" };
  }

  const users = await User.find(queryObject)
    .select("-password -refreshToken -createdAt -updatedAt -__v")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalUser = await User.countDocuments();
  return res.status(200).json({
    page,
    limit,
    totalUser,
    totalPages: Math.ceil(totalUser / limit),
    users,
  });
});

const updateBio = asyncHandler(async (req, res) => {
  const { bio } = req.body;

  if (!bio) {
    throw new ApiError(400, "Bio is required ");
  }

  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: {
      bio: bio,
    },
  }).select("-password -refreshToken -createdAt -updatedAt -__v");

  return res.status(200).json(new ApiResponse(200, user, "bio updated"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  userInfo,
  updateAvatar,
  followOtherUser,
  searchUser,
  findUser,
  updateBio,
  unFollowOtherUser,
};
