import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
  resourceType: 'image' | 'video' | 'auto' = 'auto'
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `wedding/${folder}`,
        resource_type: resourceType,
        transformation: resourceType === 'image' ? [
          { quality: 'auto:best', fetch_format: 'auto' }
        ] : undefined
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result!.secure_url, publicId: result!.public_id });
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (publicId: string, resourceType: 'image' | 'video' = 'image') => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

export { cloudinary };


export const uploadFromUrl = async (
  imageUrl: string,
  folder: string
): Promise<{ url: string; publicId: string }> => {
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder: `wedding/${folder}`,
    resource_type: 'image',
    transformation: [{ quality: 'auto:best', fetch_format: 'auto' }],
  });
  return { url: result.secure_url, publicId: result.public_id };
};

export const getWatermarkedUrl = (publicId: string): string => {
  return cloudinary.url(publicId, {
    transformation: [
      { quality: 'auto:best', fetch_format: 'auto' },
      {
        overlay: 'watermark-wedding-studio_g2yls0',
        gravity: 'center',
        width: 500,
        opacity: 100,
        flags: 'relative',
      },
    ],
    secure: true,
  });
};
