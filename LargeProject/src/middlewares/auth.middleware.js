import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model"

// todo: we can also set _ with res its a production grade 😎

const verifyJWT = asyncHandler( async (req, _, next) => {
    
    try {
        const token = req.cookies?.accesToken || req.header("Authentication")?.replace("Bearer ", "") 
    
        if(!token){
            throw new ApiError(401, "unauthorized access");
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
        .select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401, "invalid access token")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid access token")
    }
})