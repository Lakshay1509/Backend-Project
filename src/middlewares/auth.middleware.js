import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async (req, _, next) => {

    try {
        const token = req.cookies?.access|| req.header("Authorization")?.replace("Bearer ", "")
    
        if (!token) {
            throw new ApiError(401, "No token provided")
        }
    
        const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decode._id).select("-password -refereshToken")
    
    
        if (!user) {
            throw new ApiError(401, "User not found")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message)
        
    }
        
    
})