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
          { quality: 'auto:good', fetch_format: 'auto' }
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
    transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
  });
  return { url: result.secure_url, publicId: result.public_id };
};

export const getWatermarkedUrl = (publicId: string): string => {
  return cloudinary.url(publicId, {
    transformation: [
      { quality: 'auto:good', fetch_format: 'auto' },
      {
        overlay: { font_family: 'Arial', font_size: 50, font_weight: 'bold', text: encodeURIComponent('청첩장 작업실') },
        color: '#ffffff',
        opacity: 35,
        gravity: 'center',
      },
      {
        overlay: { font_family: 'Arial', font_size: 30, text: encodeURIComponent('WEDDING STUDIO LAB') },
        color: '#ffffff',
        opacity: 25,
        gravity: 'center',
        y: 60,
      },
    ],
    secure: true,
  });
};
