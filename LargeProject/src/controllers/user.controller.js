import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js';
import {User} from "../models/user.model.js";
import {uploadInCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from '../utils/apiResponce.js';

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

    if(!email || !username) {
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
            $set : {
                refreshToken: undefined
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
export { registerUser, loginUser, logoutUser }