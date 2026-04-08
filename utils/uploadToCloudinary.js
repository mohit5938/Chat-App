import cloudinary from "../config/cloudinary.js";

export const uploadToCloudinary = async (buffer, folder) => {
    try {
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: "auto",
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        });

        return result;
    } catch (error) {
        throw error;
    }
};

