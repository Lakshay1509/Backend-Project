import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"

import {User} from "../models/user.model.js"

import {upoadOnCloudinary} from "../utils/Cloudnary.js"

import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessandRefereshToken = async(userId)=>{

    try{

        const user = await User.findById(userId)
        const access = user.generateAccessToken()
        const referesh = user.generateRefreshToken()
        user.refereshToken = referesh
        await user.save({validateBeforeSave: false})
        return {access, referesh}


    }

    catch(error){
        throw new ApiError(500, "Error generating token")
    }
}

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

const loginUser = asyncHandler(async (req, res) => {    


    //req body
    //username or email
    //find the user
    //checkk for password
    //access and refersh token
    //send cookies
    //send response

    const {email,username, password} = req.body


    if(!username && !email){
        throw new ApiError(400, "Please provide username or email")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User not found")
    }

    const isPassword = await user.isPasswordCorrect(password)

    if(!isPassword){
        throw new ApiError(401, "Invalid credentials")
    }

    const {access, referesh} = await generateAccessandRefereshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refereshToken")


    const options = {
        httpOnly : true,
        secure: true

    }

    return res.status(200).cookie("access",access,options).cookie("referesh", referesh, options).json(new ApiResponse(200, {
        user: loggedInUser,access, referesh
    },
    "User logged in successfully"
    ))


})

const logoutUser = asyncHandler(async (req, res) => {  

    User.findByIdAndUpdate(req.user._id, 
        {
        
            $set: {
                refereshToken: undefined
            }
        },
        {
            new:true
        },
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("access", options).clearCookie("referesh", options).json(new ApiResponse(200, "User logged out successfully"))

    
    
})


const refereshToken = asyncHandler(async (req, res) => {

   const incomingRefereshToken= req.cookies.referesh||req.body.referesh

    if(!incomingRefereshToken){
         throw new ApiError(401, "Please provide referesh token")
    }

    try {
        const decodeToken =  jwt.verify(incomingRefereshToken, process.env.REFRESH_TOKEN_SECRET)
    
    
       const user =  User.findById(decodeToken?._id)
    
        if(!user){
             throw new ApiError(404, "User not found")
        }
    
    
        if(incomingRefereshToken !== user.refereshToken){
            throw new ApiError(401, "Invalid referesh token")
        }
    
        const options={
            httpOnly: true,
            secure: true
        }
    
    
        const {Newreferesh,access} =await generateAccessandRefereshToken(user._id)
    
        return res.status(200).cookie("access", access, options).cookie("referesh",Newreferesh,options).json(
            new ApiResponse(200, 
                {access,refereshToken: Newreferesh},
                "Token generated successfully"
            )
        )
    } catch (error) {

        throw new ApiError(401, error?.message||"Invalid referesh token")
        
    }



})


const changeCurrentPassword = asyncHandler(async(req,res)=>{

    const{oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

     const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)


    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200).json(new ApiResponse(200, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{

    return res.status(200).json(new ApiResponse(200, req.user, "User found"))

})

const updateAccount = asyncHandler(async(req,res)=>{

    const {fullname, email} = req.body

    if(!fullname || !email){
        throw new ApiError(400, "Please provide fullname and email")
    
    }


    await User.findByIdAndUpdate(

        req.user?._id,

        {
            $set: {
                fullname,
                email
            }
        },
        {
            new: true
        }
    ).select("-password ")

    return res.status(200).json(new ApiResponse(200, "Account updated successfully"))
})


const avatarUpdate = asyncHandler(async(req,res)=>{

    const avatarPath = req.file?.path

    if(!avatarPath){
        throw new ApiError(400, "Please upload avatar")
    }

    const avatarUrl = await upoadOnCloudinary(avatarPath)

    if(!avatarUrl.url){
        throw new ApiError(500, "Error uploading avatar")
    }

    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            avatar: avatarUrl.url
        }
    },
    {
        new: true
    }
    ).select("-password")

    return res.status(200).json(new ApiResponse(200, "Avatar updated successfully"))
})


const imageUpdate = asyncHandler(async(req,res)=>{

    const imagePath = req.file?.path

    if(!imagePath){
        throw new ApiError(400, "Please upload avatar")
    }

    const imageUrl = await upoadOnCloudinary(imagePath)

    if(!imageUrl.url){
        throw new ApiError(500, "Error uploading avatar")
    }

    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            coverImage: imageUrl.url
        }
    },
    {
        new: true
    }
    ).select("-password")

    return res.status(200).json(new ApiResponse(200, "Image updated successfully"))
})





export {registerUser, loginUser,logoutUser, refereshToken,changeCurrentPassword,getCurrentUser,updateAccount,avatarUpdate, imageUpdate}