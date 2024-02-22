import { v2 } from "cloudinary";
import fs from "fs";
      
v2.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_SECRET_KEY 
});

const uploadInCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;

        // todo: upload File in cloudinary
            const responce = await v2.uploader.upload(localFilePath, {
                resource_type: "auto"
            })

        //? return message 
            console.log("file uploaded successfully", responce.url)
            return responce
    } catch (error) {
        fs.unlinkSync(localFilePath) //! when file is not uploaded or failed to upload then
        return null;
    }
    
}

export { uploadInCloudinary }