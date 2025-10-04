import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret : process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });


const uploadOnCloudinary = async (localFilePath) => {
    try
    {
        console.log("Cloudinary :: uploadOnCloudinary :: Data::",localFilePath);

        // if local file path is not there then can not be upload
        if(!localFilePath) return null;

        //upload file on cloudinary
        const response =  await cloudinary.uploader.upload(localFilePath , {
            resource_type : "auto"
        })
        
        console.log("REsponse from Cloudinary :",response);
        console.log("File is Uploaded Successfully on cloudinary" , response.url);

        // If file is successfully uploaded on the cloud then delete the local file instance
        fs.unlinkSync(localFilePath);
        return response;
    }
    catch(error)
    {
        // remove file as the operation got failed.
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export {uploadOnCloudinary}