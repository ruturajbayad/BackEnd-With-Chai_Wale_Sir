import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js';
import {User} from "../models/user.model.js";
import {uploadInCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from '../utils/apiResponce.js';
import jwt from "jsonwebtoken"
// import { emit } from 'nodemon';
import mongoose from 'mongoose';

const generateAccessAndRefreshTokens = async (userId) => {
       try {
        const user = await User.findOne(userId);
        const accesToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        user.save({
            validateBeforeSave: false,
        })

        return { accesToken, refreshToken };

       } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access token and refresh token")
       }
}

const registerUser = asyncHandler( async (req, res) => {
    // ? get userdetails from frontend
    // ? validation
    // ? check if user already exists: username and email
    // ? check avtar
    // ? upload them to cloudinary, check avtar uploaded
    // ? cheate user object - create entry in db
    // ? remove password and refreshtoken fields from response
    // ? chek user created
    // ? return res

    const {fullname, email, username, password} = req.body;
    // console.log(email);
    if(
        [email, username, fullname, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "all fields is required")
    }

    const existedUser = await User.findOne({
        $or: [{email},{username}]
    })

    if(existedUser) {
        throw new ApiError(409, "user with email already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath =req.files?.coverimage[0]?.path
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0){
        coverImageLocalPath = req.files.coverimage[0].path }

    if(!avatarLocalPath) {
        throw new ApiError(400, "avatar is required")
    }
    
    const avatar = await uploadInCloudinary(avatarLocalPath)
    const coverimage = await uploadInCloudinary(coverImageLocalPath);

    if(!avatar) {
        throw new ApiError(400, "avatar is required")
    }

   const user = await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverimage: coverimage?.url || ""
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken -watchHistory")

    if(!createdUser){
        throw new ApiError(500, "something went wrong while registering")
    }

    return res.status(200).json(
        new ApiResponse(200, createdUser, "user registration successful")
    )
})

const loginUser = asyncHandler ( async (req, res) => {
    // ? get user details from frontend 
    // ? validate those user details 
    // ? find user
    // ? check password
    // ? chek authentication token and refresh token and also user details 
    // ? send in cookies ☝
    const {email, username, password} = req.body

    if(!(email || username)) {
        throw new ApiError(400, "email and username are required")
    }

    const user = await User.findOne({
        $or: [{email}, {username}]
    })

    if(!user){
        throw new ApiError(404, "User Not Found");
    }

     const isPasswordValid = await user.isPasswordCorrect(password)

     if(!isPasswordValid){
        throw new ApiError(401, "Invalid Credentials")
     }

     const {accesToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

      const loggedInuser = await User.findOne(user._id)
       .select("-password -refreshToken")
     
       const options = {
            httpOnly: true,
            secure: true,
       }

       return res
       .status(200)
       .cookie("accesToken", accesToken, options)
       .cookie("refreshToken", refreshToken, options).
       json(
        new ApiResponse(
            200,
            {
                user: loggedInuser, accesToken, refreshToken
            },
            "User logged in successfully"
        )
       )
})

const logoutUser = asyncHandler( async (req, res) => {
   await User.findByIdAndUpdate(req.user._id,
        {
            $unset : {
                refreshToken: 1
            }
        },{
            new: true
        }
        )

        const options = {
            httpOnly: true,
            secure: true,
       }

       return res
       .status(200)
       .clearCookie("accesToken", options)
       .clearCookie("refreshToken", options)
       .json(
        new ApiResponse(
            200,
            {},
            "User logged out successfully")
       )
})

const refreshAccessToken = asyncHandler( async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(404, "Refresh token not available")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,
             process.env.REFRESH_TOKEN_SECRET)
    
           const user = await User.findById(decodedToken._id)
    
        if(!user){
            throw new ApiError(404, "Invalid user")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        const {accesToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        const options ={
            httpOnly: true,
            secure: true,
        }
    
        return res
        .status(200)
        .cookie("accessToken", accesToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: user, accesToken, refreshToken: newRefreshToken
                },
                "Refresh token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "access token not found")
    }

})

const changeCurrentPassword = asyncHandler( async (req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) {
        throw new ApiError(400, "invalid password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "password changed successfully"
        )
    )
})

const getCurrentUser = asyncHandler( async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "user factched successfully"
        )
    )
})

const updateUserDetails = asyncHandler( async (req, res) => {
    const {fullname, email} = req.body

    if(!(fullname && email)) {
        throw new ApiError(400, "fullname and email are required")
    }

    const user = await User.findByIdAndUpdate(req.user._id,{
        $set: {
            fullname,
            email
        }
    },{
        new: true
    }).select("-password")

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "user details updated successfully"
        )
    )
})

const updateAvatar = asyncHandler( async (req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "avatar is required")
    }

    const avatar = await uploadInCloudinary(avatarLocalPath);

    const user = await User.findByIdAndUpdate(req.user._id,{
        $set: {
            avatar: avatar.url
        }
    },
    {
        new: true
    }).select(" -password ")

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "avatar updated successfully"
        )
    )
})

const updateCoverIamge = asyncHandler( async (req, res) => {
    const coverimageLocalPath = req.file?.path

    if(!coverimageLocalPath) {
        throw new ApiError(400, "coverfile is required")
    }

    const coverimage = await uploadInCloudinary(coverimageLocalPath);

    if(!coverimage.url){
        throw new ApiError(400, "coverfile is required")
    }

   const user = await User.findByIdAndUpdate(req.user._id,{
        $set: {
            coverimage: coverimage.url
        }
    },
    {
        new: true
    }).select(" -password ")

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "coverimage updated successfully"
        )
    )
})

const getUserChannelProfile = asyncHandler ( async (req, res) => {
    const {username} = req.params

    if(!username?.trim){
        throw new ApiError(400, "username is required")
    }
    console.log(username)

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }

        }
    ])
    console.log(channel)
    if(!channel?.length){
        throw new ApiError(404, "channel not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            channel[0], 
            "channel found successfully",
            )
    )
    
})

const getWatchHistory = asyncHandler( async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                username: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $addFields:{
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse( 
            200,
            user[0]?.watchHistory,
            "watchHistory is retrieved successfully"
        )
    )
})
export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    updateUserDetails, 
    updateAvatar, 
    updateCoverIamge,
    getUserChannelProfile,
    getWatchHistory,
    getCurrentUser
}