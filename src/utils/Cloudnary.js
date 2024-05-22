import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upoadOnCloudinary = async (loacalfilePath) => {


    try {
        if (!loacalfilePath) return null;
        const response = await cloudinary.uploader.upload(loacalfilePath, {
            resource_type: "auto",
        })

        fs.unlinkSync(loacalfilePath);
        return response;
    } catch (err) {

        fs.unlinkSync(loacalfilePath);
        return null;

    }


}

export {upoadOnCloudinary}