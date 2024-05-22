import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"

import {User} from "../models/user.model.js"

import {upoadOnCloudinary} from "../utils/Cloudnary.js"

import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
     
    //get details from frontend
    //validation
    //check if user already exist
    // chekc for images
    //check for avatar
    // uplaod them to cloudinary
    // create user object - create entry in db
    // remove password and referesh token
    // check for user creationn
    // send response

    const {fullname, email, username, password} = req.body
    //console.log(email)

    if(
        [fullname, email, username, password].some((field) => field.trim() === "")
    ){
        throw new ApiError(400, "Please fill in all fields")

    }

    const existedUser = await User.findOne({
        $or: [{email}, {username}]
    })
    if(existedUser){
       
            throw new ApiError(409, "User already exist")
    }

    const avatarPath = req.files?.avatar[0]?.path;
    //const coverImagePath = req.files?.coverImage[0]?.path;   

    let coverImagePath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImagePath = req.files.coverImage[0].path

    }


    if(!avatarPath){
        throw new ApiError(400, "Please upload  avatar and image")
    }

    const avatarUrl = await upoadOnCloudinary(avatarPath)
    const coverImageUrl = await upoadOnCloudinary(coverImagePath)

    if(!avatarUrl){
        throw new ApiError(500, "Error uploading avatar")
    }

    const user = await User.create({
        fullname,
        email,
        username : username.toLowerCase(),
        password,
        avatar: avatarUrl.url,
        coverImage: coverImageUrl?.url||"",

    })

   const createdUser =  await User.findById(user._id).select("-password -refereshToken")

   if(!createdUser){
       throw new ApiError(500, "Error creating user")
   }


   return res.status(201).json(new ApiResponse(200, "User created successfully", createdUser))

})


export {registerUser}