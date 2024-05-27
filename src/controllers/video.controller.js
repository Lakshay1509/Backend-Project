import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {upoadOnCloudinary} from "../utils/Cloudnary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    // TODO: get video, upload to cloudinary, create video

    if(
        [title, description].some((field) => field.trim() === "")
    ){
            throw new ApiError(400, "All fields are required")
    } 
    
    const videoPath = req.files?.videoFile[0]?.path;


    if(!videoPath){
        throw new ApiError(400, "Video file is required")
    }

    const thumbnailPath = req.files?.thumbnail[0]?.path;

    if(!thumbnailPath){
        throw new ApiError(400, "Thumbnail is required")
    
    }

    const videoUrl = await upoadOnCloudinary(videoPath)
    const thumbnailUrl = await upoadOnCloudinary(thumbnailPath)

    


    const video = await Video.create({
        videoFile: videoUrl.url,
        thumbnail: thumbnailUrl.url,
        title,
        description,
        duration: videoUrl.duration,
        owner: req.user._id
    })

    return res.status(201).json(new ApiResponse(201, "video published successfully", video))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.findById(videoId).select("owner title description thumbnail videoFile duration createdAt")

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    return res.status(200).json(new ApiResponse(200, "video retrieved successfully", video))


})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video Id not provided");
  }

  const { title, description} = req.body;


  if (!title || !description) {
    throw new ApiError(400, "ALl three fields are required");
  }
  

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
      },
    },
    { new: true }
  );

  if (!video) {
    throw new ApiError(500, "Video not found after updating the details");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});


const deleteVideo = asyncHandler(async (req, res) => {


    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "Video Id not provided")
    }

    const video = await Video.findById
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    await Video.findByIdAndDelete(videoId)

    return res.status(200).json(new ApiResponse(200, "Video deleted successfully"))
    
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}